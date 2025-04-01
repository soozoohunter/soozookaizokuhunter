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

const {
  JWT_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

// Sequelize models
const User = db.define('User',{
  email:DataTypes.STRING,
  password_hash:DataTypes.STRING,
  role:DataTypes.STRING
},{ tableName:'users'});

const Work = db.define('Work',{
  title:DataTypes.STRING,
  fingerprint:DataTypes.STRING,
  cloudinaryUrl:DataTypes.STRING,
  userId:DataTypes.INTEGER,
  fileType:DataTypes.STRING
},{ tableName:'works'});

// Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// multer
const allowedMime = [
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/x-m4v','video/*'
];
function fileFilter(req, file, cb){
  if(!allowedMime.includes(file.mimetype)) {
    return cb(new Error('不支援檔案類型'), false);
  }
  cb(null, true);
}
const upload = multer({ dest:'uploads/', fileFilter });

function verifyToken(token){
  try {
    return jwt.verify(token, JWT_SECRET || 'KaiKaiShieldSecret');
  } catch(e) {
    return null;
  }
}

router.post('/', upload.single('file'), async(req, res)=>{
  const tk = req.headers.authorization?.replace('Bearer ','');
  if(!tk) return res.status(401).json({ error:'未登入' });
  let dec = verifyToken(tk);
  if(!dec) return res.status(401).json({ error:'token失效' });

  if(!req.file) return res.status(400).json({ error:'請上傳檔案' });
  let user = await User.findByPk(dec.userId);
  if(!user) return res.status(404).json({ error:'用戶不存在' });

  let fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
  // role-based upload limit
  let existing = await Work.findAll({ where:{ userId:user.id }});
  let images = existing.filter(w=> w.fileType==='image').length;
  let videos = existing.filter(w=> w.fileType==='video').length;

  if(user.role==='shortVideo'){
    // 短影音網紅 → 只能上傳 video，最多5
    if(fileType==='image'){
      return res.status(400).json({ error:'短影音網紅只能上傳影片' });
    }
    if(videos >= 5){
      return res.status(400).json({ error:'已達短影音(5部)上限' });
    }
  } else {
    // ecommerce
    if(fileType==='image'){
      if(images >= 30) return res.status(400).json({ error:'已達商品圖(30)上限' });
    } else {
      if(videos >= 2) return res.status(400).json({ error:'已達影音(2)上限' });
    }
  }

  // 生成指紋 (fingerprint)
  let rawBuf = fs.readFileSync(req.file.path);
  let salt = uuidv4();
  let combined = Buffer.concat([ rawBuf, Buffer.from(salt) ]);
  let fingerprint = crypto.createHash('sha256').update(combined).digest('hex');

  try {
    // 上傳到 Cloudinary
    let cloudRes = await cloudinary.uploader.upload(req.file.path, { resource_type:'auto' });
    fs.unlinkSync(req.file.path);

    // DB 新增作品紀錄
    let newWork = await Work.create({
      title: req.body.title || (fileType==='video'?'短影音':'商品照'),
      fingerprint,
      cloudinaryUrl: cloudRes.secure_url,
      userId: user.id,
      fileType
    });

    // 呼叫 Crawler → detectInfringement
    try {
      await axios.post('http://crawler:8081/detectInfringement',{
        fingerprint,
        workId: newWork.id,
        role: user.role
      });
    } catch(e){
      console.error('啟動爬蟲失敗:', e.message);
    }

    res.json({
      message:'上傳成功並開始侵權偵測',
      fingerprint,
      cloudUrl: cloudRes.secure_url,
      workId: newWork.id
    });
  } catch(e) {
    console.error('上傳錯誤:', e.message);
    res.status(500).json({ error:e.toString() });
  }
});

module.exports = router;
