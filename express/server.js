require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const cloudinary = require('cloudinary').v2;
const path = require('path');

/////////////////////////////////
// 1. 讀取環境變數
/////////////////////////////////
const {
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,

  JWT_SECRET,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,

  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,

  DMCA_AUTO_NOTIFY
} = process.env;

/////////////////////////////////
// 2. Cloudinary 初始化
/////////////////////////////////
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

/////////////////////////////////
// 3. PostgreSQL (Sequelize)
/////////////////////////////////
const sequelize = new Sequelize(
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  { dialect: 'postgres', logging: false }
);

// User & Work Model
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING
}, { tableName: 'users' });

const Work = sequelize.define('Work', {
  title: DataTypes.STRING,
  fingerprint: DataTypes.STRING,
  cloudinaryUrl: DataTypes.STRING,
  userId: DataTypes.INTEGER
}, { tableName: 'works' });

/////////////////////////////////
// 4. Nodemailer (SMTP)
/////////////////////////////////
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

/////////////////////////////////
// 5. JWT
/////////////////////////////////
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch(e) {
    return null;
  }
}

/////////////////////////////////
// 6. 檔案上傳設定 (白名單檢查)
/////////////////////////////////
const allowedMime = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/x-m4v', 'video/*'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 保留原檔名 or 改random?
    cb(null, Date.now() + '-' + file.originalname);
  }
});

function fileFilter(req, file, cb) {
  if(!allowedMime.includes(file.mimetype)) {
    return cb(new Error('不支援此檔案類型'), false);
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter });

/////////////////////////////////
// 7. Express Init
/////////////////////////////////
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 7-1) 健康檢查
app.get('/health', (req, res) => {
  return res.json({ status: 'ok', service: 'Express' });
});

// 7-2) 註冊
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) {
    return res.status(400).json({ error: '缺少 email 或 password' });
  }

  let exist = await User.findOne({ where: { email } });
  if(exist) {
    return res.status(400).json({ error: 'Email 已被註冊' });
  }
  let newUser = await User.create({ email, password });

  // 寄送歡迎信
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'KaiKaiShield 歡迎信',
      text: '感謝您註冊 KaiKaiShield，本服務已為您開通。'
    });
  } catch(e) {
    console.error('寄信失敗：', e);
  }

  return res.json({ message: '註冊成功', userId: newUser.id });
});

// 7-3) 登入
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ where: { email, password } });
  if(!user) {
    return res.status(401).json({ error: '帳密錯誤' });
  }
  let token = signToken({ userId: user.id });
  return res.json({ message: '登入成功', token });
});

// 7-4) 上傳文件 (DCDV / SCDV)
app.post('/upload', upload.single('file'), async (req, res) => {
  // JWT 驗證
  const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if(!decoded) {
    return res.status(401).json({ error: '未授權，請提供有效 JWT' });
  }

  if(!req.file) {
    return res.status(400).json({ error: '請選擇檔案' });
  }

  // 產生二次雜湊指紋 (混合 userId & timestamp)
  const fileBuffer = fs.readFileSync(req.file.path);
  const salt = `${decoded.userId}_${Date.now()}`;
  const combinedBuffer = Buffer.concat([fileBuffer, Buffer.from(salt)]);
  const fingerprint = crypto.createHash('sha256').update(combinedBuffer).digest('hex');

  try {
    // 上傳到 Cloudinary
    const cloudinaryRes = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto'
    });
    // 刪除本地檔案
    fs.unlinkSync(req.file.path);

    // 存DB
    const newWork = await Work.create({
      title: req.body.title || 'Untitled',
      fingerprint,
      cloudinaryUrl: cloudinaryRes.secure_url,
      userId: decoded.userId
    });

    return res.json({
      message: '上傳成功',
      fingerprint,
      cloudinaryUrl: cloudinaryRes.secure_url,
      workId: newWork.id
    });
  } catch(e) {
    console.error('上傳失敗：', e);
    return res.status(500).json({ error: e.toString() });
  }
});

// 7-5) DMCA / 侵權通報
app.post('/dmca/report', async (req, res) => {
  const { infringingUrl, originalWorkId } = req.body;
  if(!infringingUrl || !originalWorkId) {
    return res.status(400).json({ error: '缺少 infringingUrl 或 originalWorkId' });
  }

  let work = await Work.findOne({ where: { id: originalWorkId } });
  if(!work) {
    return res.status(404).json({ error: '找不到作品' });
  }
  let user = await User.findOne({ where: { id: work.userId } });
  if(!user) {
    return res.status(404).json({ error: '找不到作者帳號' });
  }

  if(DMCA_AUTO_NOTIFY === 'true') {
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: 'dmca@some-platform.com',
        subject: `DMCA Takedown Request - WorkID ${originalWorkId}`,
        text: `侵權網址: ${infringingUrl}\n作者: ${user.email}\nFingerprint: ${work.fingerprint}\n請求下架。`
      });
    } catch(e) {
      console.error('DMCA 寄信失敗：', e);
    }
  }

  return res.json({
    message: '已收到 DMCA 侵權通報',
    autoNotified: (DMCA_AUTO_NOTIFY === 'true'),
  });
});

/////////////////////////////////
// 8. 啟動
/////////////////////////////////
(async ()=>{
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 連線成功！');
    await sequelize.sync();
  } catch(e) {
    console.error('PostgreSQL 連線失敗：', e);
  }

  app.listen(3000, () => {
    console.log('Express server running on port 3000');
  });
})();
