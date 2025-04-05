require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// 讀取環境變數
const {
  DATABASE_URL,
  JWT_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  RAPIDAPI_KEY,
  PORT
} = process.env;

const pool = new Pool({ connectionString: DATABASE_URL });

// Cloudinary config
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// 驗證 token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET || 'kaishieldsecret');
  } catch (e) {
    return null;
  }
}

// ----------------------------------------------------
// 健康檢查
// ----------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Express - SooZooHunter' });
});

// ----------------------------------------------------
// 用戶註冊
// ----------------------------------------------------
app.post('/api/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email/password' });
  }
  try {
    const check = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Email already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const finalRole = role || 'shortVideoCreator';
    const ins = await pool.query(`
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3) RETURNING id
    `, [email, passwordHash, finalRole]);

    res.json({ message: 'Register success', userId: ins.rows[0].id, role: finalRole });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 用戶登入
// ----------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const q = await pool.query('SELECT id, password_hash, role FROM users WHERE email=$1', [email]);
    if (q.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = q.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Password incorrect' });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: 'Login success', token, role: user.role });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------------------------------------
// 上傳檔案 + 指紋
// ----------------------------------------------------
const allowedMime = [
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/x-m4v','video/*'
];
function fileFilter(req, file, cb){
  if(!allowedMime.includes(file.mimetype)){
    return cb(new Error('File type not allowed'), false);
  }
  cb(null, true);
}
const upload = multer({ dest: 'uploads/', fileFilter });

app.post('/api/upload', upload.single('file'), async(req, res) => {
  // 驗證 token
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.replace('Bearer ', '');
  const dec = verifyToken(token);
  if(!dec) return res.status(401).json({ error: 'Invalid token' });

  if(!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // 檢查 user
    const userRes = await pool.query('SELECT id, role FROM users WHERE id=$1', [dec.userId]);
    if(userRes.rows.length === 0){
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRes.rows[0];

    // 產生指紋
    const rawBuf = fs.readFileSync(req.file.path);
    const salt = uuidv4();
    const combined = Buffer.concat([rawBuf, Buffer.from(salt)]);
    const fingerprint = crypto.createHash('sha256').update(combined).digest('hex');

    // 上傳 Cloudinary
    const cloudRes = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto'
    });
    fs.unlinkSync(req.file.path);

    // 寫入 DB
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const title = req.body.title || (fileType === 'video' ? '短影音' : '商品圖片');
    await pool.query(`
      INSERT INTO works (title, fingerprint, cloudinary_url, user_id, file_type)
      VALUES ($1, $2, $3, $4, $5)
    `, [title, fingerprint, cloudRes.secure_url, user.id, fileType]);

    // 呼叫爬蟲：若您要在上傳後立即進行侵權偵測
    // Example:
    try {
      await axios.post('http://suzoo_crawler:9090/scan', {
        fingerprint, userId: user.id, fileType
      });
    } catch(e){
      console.error('Crawler call fail:', e.message);
    }

    res.json({
      message: 'Upload success',
      fingerprint,
      cloudUrl: cloudRes.secure_url
    });

  } catch(err){
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 侵權 (foundInfringement, DMCA等) - 範例
// ----------------------------------------------------
app.post('/api/infr/foundInfringement', async(req, res)=>{
  const { workId, infringingUrl, status } = req.body;
  if(!workId || !infringingUrl){
    return res.status(400).json({error:'Missing workId / infringingUrl'});
  }
  try {
    // 檢查 works
    const wq = await pool.query('SELECT id,user_id FROM works WHERE id=$1', [workId]);
    if(wq.rows.length === 0){
      return res.status(404).json({ error:'Work not found' });
    }
    // 建立/更新 infringement
    const iq = await pool.query('SELECT id FROM infringements WHERE work_id=$1 AND infringing_url=$2', [workId, infringingUrl]);
    if(iq.rows.length === 0){
      await pool.query(`
        INSERT INTO infringements(work_id, infringing_url, status)
        VALUES ($1, $2, $3)
      `, [workId, infringingUrl, status || 'detected']);
    } else {
      await pool.query(`
        UPDATE infringements SET status=$1 WHERE id=$2
      `, [status || 'detected', iq.rows[0].id]);
    }
    res.json({message:'foundInfringement recorded'});
  } catch(err){
    console.error('foundInfringement error:', err.message);
    res.status(500).json({error:err.message});
  }
});

app.post('/api/infr/dmca', async(req,res)=>{
  // 簡易 token 驗證
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({ error:'No token' });
  const dec = verifyToken(authHeader.replace('Bearer ',''));
  if(!dec) return res.status(401).json({ error:'Invalid token' });

  const { workId, infringingUrl } = req.body;
  if(!workId || !infringingUrl) return res.status(400).json({error:'Missing params'});

  try {
    // 檢查該 work 是否屬於此用戶
    const wq = await pool.query('SELECT id,user_id,fingerprint FROM works WHERE id=$1', [workId]);
    if(wq.rows.length === 0) return res.status(404).json({error:'Work not found'});
    const w = wq.rows[0];
    if(w.user_id !== dec.userId) {
      return res.status(403).json({error:'No permission'});
    }

    // 更新 infringement 狀態
    const iq = await pool.query('SELECT id FROM infringements WHERE work_id=$1 AND infringing_url=$2', [workId, infringingUrl]);
    if(iq.rows.length === 0){
      // 若尚未存在, 建立
      await pool.query(`
        INSERT INTO infringements (work_id, infringing_url, status)
        VALUES ($1, $2, 'dmca')
      `, [workId, infringingUrl]);
    } else {
      await pool.query(`
        UPDATE infringements SET status='dmca' WHERE id=$1
      `, [iq.rows[0].id]);
    }
    // TODO: 可在此寄出郵件 / DMCA 通知
    res.json({message:'DMCA done'});
  } catch(err){
    console.error('DMCA error:', err.message);
    res.status(500).json({error:err.message});
  }
});

app.get('/api/infr/list', async(req,res)=>{
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({ error:'No token' });
  const dec = verifyToken(authHeader.replace('Bearer ',''));
  if(!dec) return res.status(401).json({ error:'Invalid token' });

  try {
    // 找到 user 的 works
    const wq = await pool.query('SELECT id FROM works WHERE user_id=$1', [dec.userId]);
    const workIds = wq.rows.map(r => r.id);
    if(workIds.length === 0) {
      return res.json([]); // 沒有任何作品
    }
    const inf = await pool.query(`
      SELECT * FROM infringements
      WHERE work_id = ANY($1)
      ORDER BY created_at DESC
    `, [workIds]);
    res.json(inf.rows);
  } catch(err){
    console.error('list error:', err.message);
    res.status(500).json({error:err.message});
  }
});

// ----------------------------------------------------
const port = PORT || 3000;
app.listen(port, () => {
  console.log(`[Express] running on port ${port}`);
});
