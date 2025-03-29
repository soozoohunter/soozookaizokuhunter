require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');

const {
  POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT,

  JWT_SECRET,
  EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM,

  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,

  DMCA_AUTO_NOTIFY
} = process.env;

// Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Sequelize
const sequelize = new Sequelize(
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  { dialect: 'postgres', logging: false }
);

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING
}, { tableName: 'users' });

const Work = sequelize.define('Work', {
  title: DataTypes.STRING,
  fingerprint: DataTypes.STRING,
  cloudinaryUrl: DataTypes.STRING,
  userId: DataTypes.INTEGER
}, { tableName: 'works' });

// Nodemailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// JWT
const revokedTokens = new Set();

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}
function verifyToken(token) {
  if (revokedTokens.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch(e) {
    return null;
  }
}

// Multer
const allowedMime = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/x-m4v', 'video/*'
];
function fileFilter(req, file, cb) {
  if(!allowedMime.includes(file.mimetype)) {
    return cb(new Error('不支援此檔案類型'), false);
  }
  cb(null, true);
}
const upload = multer({ dest: 'uploads/', fileFilter });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Express V6' });
});

// 註冊
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: '缺少 email 或 password' });

  const exist = await User.findOne({ where: { email } });
  if(exist) return res.status(400).json({ error: 'Email 已被註冊' });

  const bcrypt = require('bcrypt');
  const hashed = await bcrypt.hash(password, 10);
  const newUser = await User.create({ email, password_hash: hashed });

  // 寄送歡迎信
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'KaiKaiShield 歡迎信',
      text: '感謝您註冊 KaiKaiShield，本服務已為您開通。'
    });
  } catch(e) {
    console.error('寄信失敗：', e.message);
  }

  res.json({ message: '註冊成功', userId: newUser.id });
});

// 登入
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require('bcrypt');

  let user = await User.findOne({ where: { email } });
  if(!user) return res.status(401).json({ error: 'User not found' });

  let match = await bcrypt.compare(password, user.password_hash);
  if(!match) return res.status(401).json({ error: '密碼錯誤' });

  let token = signToken({ userId: user.id, email });
  res.json({ message: '登入成功', token });
});

// 登出
app.post('/logout', (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  if(!token) return res.status(400).json({ error: '缺少token' });
  revokedTokens.add(token);
  res.json({ message: '已登出, Token已被撤銷' });
});

// 上傳 (DCDV / SCDV)
app.post('/upload', upload.single('file'), async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error: '未授權或Token已失效' });

  if(!req.file) return res.status(400).json({ error: '請選擇檔案' });
  const fileBuffer = fs.readFileSync(req.file.path);

  // 用UUIDv4做salt + sha3-256
  const salt = uuidv4();
  const combined = Buffer.concat([fileBuffer, Buffer.from(salt)]);
  const fingerprint = crypto.createHash('sha3-256').update(combined).digest('hex');

  try {
    let result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });
    fs.unlinkSync(req.file.path);

    let newWork = await Work.create({
      title: req.body.title || 'Untitled',
      fingerprint,
      cloudinaryUrl: result.secure_url,
      userId: decoded.userId
    });

    res.json({
      message: '上傳成功',
      fingerprint,
      cloudinaryUrl: result.secure_url,
      workId: newWork.id
    });
  } catch(e) {
    console.error('上傳失敗：', e.message);
    res.status(500).json({ error: e.toString() });
  }
});

// DMCA通報
app.post('/dmca/report', async (req, res) => {
  const { infringingUrl, workId } = req.body;
  if(!infringingUrl || !workId) {
    return res.status(400).json({ error: '缺少 infringingUrl 或 workId' });
  }

  let found = await Work.findByPk(workId);
  if(!found) {
    return res.status(404).json({ error: '無此作品id' });
  }

  // 找作者
  let user = await User.findByPk(found.userId);
  if(!user) {
    return res.status(404).json({ error: '作者不存在' });
  }

  if(DMCA_AUTO_NOTIFY === 'true') {
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: 'dmca@some-platform.com',
        subject: `DMCA Takedown - WorkID ${workId}`,
        text: `侵權網址: ${infringingUrl}\n作者: ${user.email}\nFingerprint: ${found.fingerprint}`
      });
    } catch(e) {
      console.error('DMCA寄信失敗：', e.message);
    }
  }

  res.json({ message: 'DMCA通報已接收', autoNotified: DMCA_AUTO_NOTIFY });
});

// DB連線 & 啟動
(async ()=>{
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 連線成功');
    await sequelize.sync();
  } catch(e) {
    console.error('連線失敗：', e);
  }

  app.listen(3000, ()=>{
    console.log('Express (V6) on port 3000');
  });
})();
