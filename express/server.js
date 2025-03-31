/********************************************
 * express/server.js - 最終版
 ********************************************/
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
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// 從 .env 中讀取資料
const {
  POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT,
  JWT_SECRET,
  EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM,
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
} = process.env;

// rate-limit 全域限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100,                 // 同一IP最多100請求
  message: '請求次數過多，請稍後再試'
});

// 初始化 express
const app = express();
app.use(limiter);          // 全域套用
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 設定 Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// PostgreSQL - Sequelize 連線
const sequelize = new Sequelize(
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  { dialect: 'postgres', logging: false }
);

// 定義資料表
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING,
  role: DataTypes.STRING
}, { tableName:'users' });

const Work = sequelize.define('Work', {
  title: DataTypes.STRING,
  fingerprint: DataTypes.STRING,
  cloudinaryUrl: DataTypes.STRING,
  userId: DataTypes.INTEGER,
  fileType: DataTypes.STRING
}, { tableName:'works' });

// nodemailer
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
  return jwt.sign(payload, JWT_SECRET || 'defaultSecret', { expiresIn: '2h' });
}
function verifyToken(token) {
  if (revokedTokens.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET || 'defaultSecret');
  } catch(e) {
    return null;
  }
}

// multer - 上傳
const allowedMime = [
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/x-m4v','video/*'
];
function fileFilter(req, file, cb) {
  if(!allowedMime.includes(file.mimetype)) {
    return cb(new Error('不支援的檔案類型'), false);
  }
  cb(null, true);
}
const upload = multer({ dest: 'uploads/', fileFilter });

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Express Final with RateLimit' });
});

// 註冊
app.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;
  if(!email || !password) {
    return res.status(400).json({ error: '缺少 email 或 password' });
  }
  const bcrypt = require('bcrypt');
  const exist = await User.findOne({ where:{ email }});
  if(exist) return res.status(400).json({ error: 'Email 已被註冊' });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = await User.create({ email, password_hash: hashed, role: role || 'shortVideo' });
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Welcome to Suzookaizokuhunter',
      text: '感謝註冊' 
    });
  } catch(e) {
    console.error('寄信失敗:', e.message);
  }
  res.json({ message: '註冊成功', userId: newUser.id });
});

// 登入
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require('bcrypt');
  const user = await User.findOne({ where:{ email } });
  if(!user) return res.status(401).json({ error: '用戶不存在' });
  const match = await bcrypt.compare(password, user.password_hash);
  if(!match) return res.status(401).json({ error: '密碼錯誤' });

  const token = signToken({ userId: user.id, email, role: user.role });
  res.json({ message:'登入成功', token, role: user.role });
});

// 登出
app.post('/logout',(req,res)=>{
  const token = req.headers.authorization?.replace('Bearer ','');
  if(!token) return res.status(400).json({ error:'缺少 token' });
  revokedTokens.add(token);
  res.json({ message:'已登出, Token已撤銷' });
});

// 上傳 (短影音 / 商品照)
app.post('/upload', upload.single('file'), async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ','');
  const decoded = verifyToken(token);
  if(!decoded) return res.status(401).json({ error:'未授權' });

  if(!req.file) return res.status(400).json({ error:'請選擇檔案' });
  const user = await User.findByPk(decoded.userId);
  if(!user) return res.status(404).json({ error:'找不到用戶' });

  // role => shortVideo => 最多5部影片
  // role => ecommerce => 30張圖 + 2部影片
  const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
  const works = await Work.findAll({ where:{ userId: user.id }});
  const imageCount = works.filter(w => w.fileType === 'image').length;
  const videoCount = works.filter(w => w.fileType === 'video').length;

  if(user.role === 'shortVideo') {
    if(fileType === 'image') {
      return res.status(400).json({ error:'短影音網紅僅能上傳影片' });
    }
    if(videoCount >= 5) {
      return res.status(400).json({ error:'已達短影音5部上限' });
    }
  } else if(user.role === 'ecommerce') {
    if(fileType === 'image') {
      if(imageCount >= 30) return res.status(400).json({ error:'已達商品照30張上限' });
    } else {
      if(videoCount >= 2) return res.status(400).json({ error:'已達短影音2部上限' });
    }
  }

  // 產生指紋
  const fileBuf = fs.readFileSync(req.file.path);
  const salt = uuidv4();
  const combined = Buffer.concat([fileBuf, Buffer.from(salt)]);
  const fingerprint = crypto.createHash('sha3-256').update(combined).digest('hex');

  try {
    // 上傳至 Cloudinary
    const cloudRes = await cloudinary.uploader.upload(req.file.path,{ resource_type:'auto' });
    fs.unlinkSync(req.file.path);

    // 寫DB
    const newWork = await Work.create({
      title: req.body.title || (fileType==='video'?'短影音':'商品照片'),
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      userId: user.id,
      fileType
    });

    // 呼叫爬蟲 => /detectInfringement (範例)
    try {
      const axios = require('axios');
      await axios.post('http://crawler:8081/detectInfringement', {
        fingerprint, workId: newWork.id, role: user.role
      });
    } catch(e) {
      console.error('呼叫爬蟲失敗:', e.message);
    }
    res.json({
      message:'上傳成功, 已啟動侵權偵測',
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      workId: newWork.id
    });
  } catch(e) {
    console.error('上傳錯誤:', e.message);
    res.status(500).json({ error: e.toString() });
  }
});

// DMCA 通報 (範例)
app.post('/dmca/report', async (req, res) => {
  const { infringingUrl, workId } = req.body;
  if(!infringingUrl || !workId) {
    return res.status(400).json({ error:'缺少 infringingUrl / workId' });
  }
  const found = await Work.findByPk(workId);
  if(!found) return res.status(404).json({ error:'無此作品' });

  // (範例) - nodemailer 通報
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: 'dmca@some-platform.com',
      subject: `DMCA Takedown - WorkID ${workId}`,
      text: `侵權網址: ${infringingUrl} \nFingerprint: ${found.fingerprint}`
    });
  } catch(e) {
    console.error('DMCA寄信失敗:', e.message);
  }
  res.json({ message:'DMCA通報已接收' });
});

// 啟動 & DB init
(async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 連線成功');
    await sequelize.sync();
  } catch(e) {
    console.error('PostgreSQL 連線失敗:', e.message);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Express Final on port ${PORT}`);
  });
})();
