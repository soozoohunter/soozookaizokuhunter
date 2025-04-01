// express/routes/upload.js

require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');

const db = require('../db');
const { DataTypes } = require('sequelize');

// 引用 User / Work Model（若您有獨立檔案）
// 這裡示範直接定義，您可以改成 require('../models/User'), require('../models/Work')
const User = db.define('User', {
  email: DataTypes.STRING,
  password_hash: DataTypes.STRING,
  role: DataTypes.STRING
}, { tableName: 'users' });

const Work = db.define('Work', {
  title: DataTypes.STRING,
  fingerprint: DataTypes.STRING,
  cloudinaryUrl: DataTypes.TEXT,
  userId: DataTypes.INTEGER,
  fileType: DataTypes.STRING
}, { tableName: 'works' });

// 讀取 .env
const {
  JWT_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

// Cloudinary 設定
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// multer - 設定檔案類型
const allowedMime = [
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/x-m4v','video/*'
];
function fileFilter(req, file, cb) {
  if (!allowedMime.includes(file.mimetype)) {
    return cb(new Error('不支援該檔案類型'), false);
  }
  cb(null, true);
}
const upload = multer({ dest: 'uploads/', fileFilter });

// 驗證 token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET || 'KaiKaiShieldSecret');
  } catch (e) {
    return null;
  }
}

/**
 * [POST] /api/upload
 * 上傳檔案 -> 產生SHA-256指紋 -> 上傳到Cloudinary -> (可)呼叫爬蟲
 */
router.post('/', upload.single('file'), async (req, res) => {
  const tk = req.headers.authorization?.replace('Bearer ', '');
  if (!tk) return res.status(401).json({ error: '未登入' });

  let dec = verifyToken(tk);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  // 檔案必須存在
  if (!req.file) return res.status(400).json({ error: '請上傳檔案' });

  // 找用戶
  let user = await User.findByPk(dec.userId);
  if (!user) return res.status(404).json({ error: '用戶不存在' });

  // 確認檔案類型(圖片 or 影片)
  let fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

  // 假設我們限制不同角色上傳數量
  // 取出該用戶已上傳的 Works
  let existing = await Work.findAll({ where: { userId: user.id } });
  let imagesCount = existing.filter(w => w.fileType === 'image').length;
  let videosCount = existing.filter(w => w.fileType === 'video').length;

  // 如：網紅 => 只可上傳 video 最多5
  if (user.role === 'shortVideo') {
    if (fileType === 'image') {
      return res.status(400).json({ error: '短影音網紅只能上傳影片' });
    }
    if (videosCount >= 5) {
      return res.status(400).json({ error: '已達短影音(5部)上限' });
    }
  } 
  // 電商 => 圖片最多30, 影片最多2
  else {
    if (fileType === 'image') {
      if (imagesCount >= 30) {
        return res.status(400).json({ error: '已達商品圖(30)上限' });
      }
    } else {
      if (videosCount >= 2) {
        return res.status(400).json({ error: '已達影音(2)上限' });
      }
    }
  }

  // 生成指紋
  let rawBuf = fs.readFileSync(req.file.path);
  let salt = uuidv4();
  let combined = Buffer.concat([rawBuf, Buffer.from(salt)]);
  let fingerprint = crypto.createHash('sha256').update(combined).digest('hex');

  try {
    // 上傳Cloudinary
    let cloudRes = await cloudinary.uploader.upload(req.file.path, {
      resource_type: fileType === 'video' ? 'video' : 'image'
    });
    // 刪除本地暫存
    fs.unlinkSync(req.file.path);

    // DB 建立 Work
    let newWork = await Work.create({
      title: req.body.title || (fileType === 'video' ? '短影音' : '商品圖'),
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      userId: user.id,
      fileType
    });

    // (可選)呼叫 Crawler 容器，開始侵權偵測
    try {
      await axios.post('http://suzoo_crawler:8081/detectInfringement', {
        fingerprint,
        workId: newWork.id
      });
    } catch (e) {
      console.error('呼叫爬蟲失敗:', e.message);
    }

    res.json({
      message: '上傳成功，已啟動侵權偵測',
      fingerprint,
      cloudUrl: cloudRes.secure_url,
      workId: newWork.id
    });
  } catch (e) {
    console.error('上傳錯誤:', e.message);
    res.status(500).json({ error: e.toString() });
  }
});

module.exports = router;
