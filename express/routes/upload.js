/* express/routes/upload.js */
require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Sequelize
const { writeToBlockchain } = require('../utils/chain');

// Multer：檔案暫存到 uploads/ 目錄
const upload = multer({ dest:'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// JWT 驗證 Middleware (不改語法)
function authMiddleware(req, res, next){
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if(!token) return res.status(401).json({ error:'缺少 Token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch(e){
    return res.status(401).json({ error:'無效的 Token' });
  }
}

// 根據方案做限制 (已擴充 ADVANCED)
async function planLimitCheck(user, fileType){
  // BASIC => 短影音=3, 圖=10
  // ADVANCED => 短影音=5, 圖=20
  // PRO => 50, 150
  // ENTERPRISE => 無上限
  let maxVideo = 3, maxImg = 10, maxTm = 1;
  if(user.plan === 'ADVANCED'){
    maxVideo = 5; maxImg = 20; maxTm = 2; // trademark=2 (自行設定)
  } else if(user.plan === 'PRO'){
    maxVideo = 50; maxImg = 150; maxTm = 10;
  } else if(user.plan === 'ENTERPRISE'){
    maxVideo = 999999; maxImg = 999999; maxTm = 999999;
  }

  if(fileType==='shortVideo' && user.uploadVideos>=maxVideo){
    return false;
  }
  if(fileType==='image' && user.uploadImages>=maxImg){
    return false;
  }
  if(fileType==='trademark' && user.uploadTrademarks>=maxTm){
    return false;
  }
  return true;
}

// 更新計數
function incrementUsage(user, fileType){
  if(fileType==='shortVideo'){
    user.uploadVideos++;
  } else if(fileType==='image'){
    user.uploadImages++;
  } else if(fileType==='trademark'){
    user.uploadTrademarks++;
  }
}

// 上傳路由
router.post('/', authMiddleware, upload.single('file'), async (req, res)=>{
  try {
    const user = await User.findByPk(req.user.userId);
    if(!user) return res.status(404).json({ error:'找不到使用者' });

    const { fileType } = req.body;  // 'shortVideo' | 'image' | 'trademark'
    if(!req.file || !fileType){
      return res.status(400).json({ error:'缺少檔案或 fileType' });
    }

    // 檢查方案限制
    const canUpload = await planLimitCheck(user, fileType);
    if(!canUpload){
      return res.status(403).json({
        error:`[${user.plan}] 已達 ${fileType} 上傳上限`
      });
    }

    // 計算指紋
    const buffer = fs.readFileSync(req.file.path);
    const fingerprint = crypto.createHash('md5').update(buffer).digest('hex');

    // (可選) 寫區塊鏈
    const dataOnChain = `USER:${user.email}|TYPE:${fileType}|DNA:${fingerprint}`;
    let txHash = null;
    try {
      txHash = await writeToBlockchain(dataOnChain);
    } catch(e) {
      console.error('鏈上紀錄失敗:', e);
    }

    // 更新用戶計數
    incrementUsage(user, fileType);
    await user.save();

    // 刪除暫存檔
    fs.unlinkSync(req.file.path);

    return res.json({
      message:'上傳成功',
      fileType,
      fingerprint,
      txHash,
      plan:user.plan,
      uploadVideos:user.uploadVideos,
      uploadImages:user.uploadImages,
      uploadTrademarks:user.uploadTrademarks
    });
  } catch(e){
    console.error('[Upload]', e);
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
