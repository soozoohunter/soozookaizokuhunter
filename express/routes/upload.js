// express/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Work = require('../models/Work');
const { writeToBlockchain } = require('../utils/chain');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const planLimit = {
  BASIC: { shortVideo:3, image:15, trademark:1 },
  PRO: { shortVideo:50, image:150, trademark:10 },
  ENTERPRISE: { shortVideo:999999, image:999999, trademark:999999 }
};

function auth(req, res, next){
  try {
    const token = (req.headers.authorization||'').replace(/^Bearer\s+/,'');
    if(!token) return res.status(401).json({ error:'尚未登入' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e){
    return res.status(401).json({ error:'token失效' });
  }
}

const upload = multer({ dest:'uploads/' });

router.post('/', auth, upload.single('file'), async(req, res)=>{
  try {
    const { fileType, keywords, title } = req.body;
    if(!req.file){
      return res.status(400).json({ error:'尚未選擇檔案' });
    }
    if(!fileType || !['shortVideo','image','trademark'].includes(fileType)){
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error:'fileType 錯誤' });
    }

    const user = await User.findByPk(req.user.id);
    if(!user){
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error:'用戶不存在' });
    }

    // 檢查限額
    const limit = planLimit[user.plan] || planLimit.BASIC;
    if(fileType==='shortVideo'){
      if(user.uploadVideos >= limit.shortVideo){
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error:'短影音已達上限' });
      }
    } else if(fileType==='image'){
      if(user.uploadImages >= limit.image){
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error:'靜態圖檔已達上限' });
      }
    } else {
      if(user.uploadTrademarks >= limit.trademark){
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error:'商標已達上限' });
      }
    }

    // fingerprint
    const buffer = fs.readFileSync(req.file.path);
    const fingerprint = crypto.createHash('md5').update(buffer).digest('hex');

    // 上鏈
    let txHash = '';
    try {
      const dataOnChain = `User=${user.email}|fileType=${fileType}|fp=${fingerprint}`;
      txHash = await writeToBlockchain(dataOnChain);
    } catch(e){
      console.error('[chain error]', e);
      txHash = 'FAILED';
    }

    // 記錄 Work
    const newWork = await Work.create({
      userId:user.id,
      title: title || '(Untitled)',
      fileType,
      keywords: keywords || '',
      fingerprint,
      chainTx: txHash
    });

    // 更新 Usage
    if(fileType==='shortVideo'){
      user.uploadVideos++;
    } else if(fileType==='image'){
      user.uploadImages++;
    } else {
      user.uploadTrademarks++;
    }
    await user.save();

    fs.unlinkSync(req.file.path);

    return res.json({
      message:'上傳成功',
      fileType,
      fingerprint,
      txHash,
      plan:user.plan,
      usedVideos:user.uploadVideos,
      usedImages:user.uploadImages,
      usedTrademarks:user.uploadTrademarks,
      workId:newWork.id
    });
  } catch(e){
    console.error('[Upload Error]', e);
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
