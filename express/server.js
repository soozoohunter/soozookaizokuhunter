// express/server.js

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const sequelize = require('./db');
const chain = require('./utils/chain');

// 路由
const authRouter = require('./routes/auth');          // /auth
const membershipRouter = require('./routes/membership'); // /membership

const User = require('./models/User'); // 為了上傳限制要抓 user 資訊

const app = express();
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

// 解析 JSON/URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

// Health
app.get('/health', (req, res)=>{
  res.json({ message:'Server healthy' });
});

/**
 * (A) /auth
 */
app.use('/auth', authRouter);

/**
 * (B) 區塊鏈 => /chain/...
 */
app.post('/chain/store', async(req,res)=>{
  try {
    const { data } = req.body;
    if(!data){
      return res.status(400).json({ success:false, error:'Missing data field' });
    }
    const txHash = await chain.writeToBlockchain(data);
    return res.json({ success:true, txHash });
  } catch(e){
    console.error('Error writing data to chain:', e);
    return res.status(500).json({ success:false, error:e.message });
  }
});
app.post('/chain/writeUserAsset', async(req,res)=>{
  try {
    const { userEmail, dnaHash, fileType, timestamp } = req.body;
    if(!userEmail || !dnaHash){
      return res.status(400).json({ success:false, error:'Missing required fields' });
    }
    const txHash = await chain.writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp);
    return res.json({ success:true, txHash });
  } catch(e){
    console.error('Error writeUserAssetToChain:', e);
    return res.status(500).json({ success:false, error:e.message });
  }
});
app.post('/chain/writeInfringement', async(req,res)=>{
  try {
    const { userEmail, infrInfo, timestamp } = req.body;
    if(!userEmail || !infrInfo){
      return res.status(400).json({ success:false, error:'Missing userEmail or infrInfo' });
    }
    const txHash = await chain.writeInfringementToChain(userEmail, infrInfo, timestamp);
    return res.json({ success:true, txHash });
  } catch(e){
    console.error('Error writeInfringementToChain:', e);
    return res.status(500).json({ success:false, error:e.message });
  }
});

/**
 * (C) /membership => 顯示 & 升級 會員
 */
app.use('/membership', membershipRouter);

/**
 * (D) 檔案上傳 /api/upload
 */
const upload = multer({ dest:'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function authMiddleware(req,res,next){
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/,'');
    if(!token) return res.status(401).json({ error:'尚未登入或缺少 Token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch(e){
    console.error('Token 驗證失敗:', e);
    return res.status(401).json({ error:'Token 無效或已過期' });
  }
}

/**
 * 依方案限制:
 *  BASIC: 最多可上傳 3 個影片 + 10 張圖片
 *  PRO / ENTERPRISE: 不限
 */
function planUploadLimitCheck(req, res, next) {
  const userId = req.user.id;
  // 先去DB查 user
  User.findByPk(userId)
    .then(user=>{
      if(!user) {
        return res.status(404).json({ error:'使用者不存在' });
      }
      // 簡單判斷: 若 user.plan='BASIC' => 限制
      if(user.plan==='BASIC'){
        // 判斷檔案類型? 這裡假設: mp4,mov -> 視為影片; png,jpg -> 視為圖片
        const fileName = (req.file?.originalname||'').toLowerCase();
        if(fileName.endsWith('.mp4') || fileName.endsWith('.mov')){
          if(user.uploadVideos>=3){
            return res.status(403).json({ error:'影片上傳已達 BASIC 方案 3次上限' });
          }
        } else if(fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')){
          if(user.uploadImages>=10){
            return res.status(403).json({ error:'圖片上傳已達 BASIC 方案 10次上限' });
          }
        }
        // 若都沒超過 -> 通過, attach userObj
        req._userObj = user; 
        next();
      } else {
        // PRO/ENTERPRISE 不限
        req._userObj = user; 
        next();
      }
    })
    .catch(err=>{
      console.error('[planUploadLimitCheck] Error:', err);
      res.status(500).json({ error: err.message });
    });
}

app.post('/api/upload', authMiddleware, upload.single('file'), planUploadLimitCheck, async(req,res)=>{
  try {
    if(!req.file){
      return res.status(400).json({ error:'沒有檔案' });
    }
    const userEmail = req.user.email || 'unknown@domain.com';
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const fingerprint = crypto.createHash('md5').update(buffer).digest('hex');

    // (可選) 上鏈
    try {
      const txHash = await chain.writeToBlockchain(`${userEmail}|${fingerprint}`);
      console.log('[Upload] fingerprint上鏈成功 =>', txHash);
    } catch(chainErr){
      console.error('[Upload] 上鏈失敗 =>', chainErr);
    }

    // 更新上傳次數
    const userObj = req._userObj; // 在planUploadLimitCheck掛進來
    const lowerName = (req.file.originalname||'').toLowerCase();
    if(userObj.plan==='BASIC'){
      // 簡單判斷檔案後綴
      if(lowerName.endsWith('.mp4')||lowerName.endsWith('.mov')){
        userObj.uploadVideos += 1;
      } else if(lowerName.endsWith('.jpg')||lowerName.endsWith('.jpeg')||lowerName.endsWith('.png')){
        userObj.uploadImages += 1;
      }
      await userObj.save();
    }

    // 刪除暫存檔
    fs.unlinkSync(filePath);

    res.json({
      message: '上傳成功',
      fileName: req.file.originalname,
      fingerprint,
      plan: userObj.plan,
      usedVideos: userObj.uploadVideos,
      usedImages: userObj.uploadImages
    });
  } catch(err){
    console.error('[Upload Error]', err);
    res.status(500).json({ error:err.message });
  }
});

/**
 * 同步資料表 & 啟動
 */
sequelize.sync({ alter:false })
  .then(()=>{
    console.log('All tables synced!');
    app.listen(PORT, HOST, ()=>{
      console.log(`Express server is running on http://${HOST}:${PORT}`);
    });
  })
  .catch(err=>{
    console.error('Unable to sync tables:', err);
  });
