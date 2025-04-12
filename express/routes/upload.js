require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { writeToBlockchain } = require('../utils/chain');

const upload = multer({ dest:'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function authMiddleware(req, res, next){
  try {
    const token = (req.headers.authorization||'').replace(/^Bearer\s+/,'');
    if(!token) return res.status(401).json({ error:'缺少 Token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch(e){
    return res.status(401).json({ error:'無效的 Token' });
  }
}

// 根據方案做限制
async function planLimitCheck(user, fileType){
  // BASIC => 短影音=3, 圖=15, 商標=1
  // PRO => 50, 150, 10
  // ENTERPRISE => 無上限
  let maxVideo=3, maxImg=15, maxTm=1;
  if(user.plan==='PRO'){
    maxVideo=50; maxImg=150; maxTm=10;
  } else if(user.plan==='ENTERPRISE'){
    maxVideo=999999; maxImg=999999; maxTm=999999;
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

function incrementUsage(user, fileType){
  if(fileType==='shortVideo') user.uploadVideos++;
  else if(fileType==='image') user.uploadImages++;
  else if(fileType==='trademark') user.uploadTrademarks++;
}

router.post('/', authMiddleware, upload.single('file'), async (req, res)=>{
  try {
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'找不到使用者' });

    const { fileType } = req.body;  // 'shortVideo' | 'image' | 'trademark'
    if(!req.file || !fileType){
      return res.status(400).json({ error:'缺少檔案或 fileType' });
    }

    // 檢查方案限制
    const canUpload = await planLimitCheck(user, fileType);
    if(!canUpload){
      return res.status(403).json({ error:`[${user.plan}] 已達 ${fileType} 上傳上限` });
    }

    // 計算指紋
    const buffer = fs.readFileSync(req.file.path);
    const fingerprint = crypto.createHash('md5').update(buffer).digest('hex');

    // 上鏈
    const dataOnChain = `USER:${user.email}|TYPE:${fileType}|DNA:${fingerprint}`;
    const txHash = await writeToBlockchain(dataOnChain);

    // 更新使用量
    incrementUsage(user, fileType);
    await user.save();

    // 刪除上傳的暫存檔
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
    res.status(500).json({ error:e.message });
  }
});

module.exports = router;
