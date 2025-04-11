// express/server.js

require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const sequelize = require('./db');           // 連線 Postgres
const chain = require('./utils/chain');      // 區塊鏈函式
const authRouter = require('./routes/auth'); // /auth 路由

const app = express();
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

// 解析 JSON/URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.json({ message: 'Server healthy' });
});

/**
 * ================================
 * A) /auth 路由
 * ================================
 * 前端打 /api/auth/... => 這裡對應 /auth
 */
app.use('/auth', authRouter);

/**
 * ================================
 * B) 區塊鏈 => /chain/...
 * ================================ 
 * 三個 POST 路由
 */
app.post('/chain/store', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, error: 'Missing data field' });
    }
    const txHash = await chain.writeToBlockchain(data);
    return res.json({ success: true, txHash });
  } catch (error) {
    console.error('Error writing data to blockchain:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/chain/writeUserAsset', async (req, res) => {
  try {
    const { userEmail, dnaHash, fileType, timestamp } = req.body;
    if (!userEmail || !dnaHash) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const txHash = await chain.writeUserAssetToChain(userEmail, dnaHash, fileType, timestamp);
    return res.json({ success: true, txHash });
  } catch (error) {
    console.error('Error writing user asset to chain:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/chain/writeInfringement', async (req, res) => {
  try {
    const { userEmail, infrInfo, timestamp } = req.body;
    if (!userEmail || !infrInfo) {
      return res.status(400).json({ success: false, error: 'Missing userEmail or infrInfo' });
    }
    const txHash = await chain.writeInfringementToChain(userEmail, infrInfo, timestamp);
    return res.json({ success: true, txHash });
  } catch (error) {
    console.error('Error writing infringement to chain:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ================================
 * C) 檔案上傳 => /api/upload
 * ================================
 */
const upload = multer({ dest:'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function authMiddleware(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (!token) return res.status(401).json({ error:'尚未登入或缺少 Token' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch(e) {
    console.error('Token 驗證失敗:', e);
    return res.status(401).json({ error:'Token 無效或已過期' });
  }
}

app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res)=>{
  try {
    if(!req.file) {
      return res.status(400).json({ error:'沒有檔案' });
    }

    const userEmail = req.user.email || 'unknown@domain.com';
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);

    // md5 指紋
    const fingerprint = crypto.createHash('md5').update(buffer).digest('hex');

    // (可選) 上鏈
    try {
      const txHash = await chain.writeToBlockchain(`${userEmail}|${fingerprint}`);
      console.log('[Upload] fingerprint上鏈成功 =>', txHash);
    } catch(chainErr) {
      console.error('[Upload] 上鏈失敗 =>', chainErr);
    }

    // 刪除暫存檔
    fs.unlinkSync(filePath);

    res.json({
      message: '上傳成功',
      fileName: req.file.originalname,
      fingerprint
    });

  } catch(err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ================================
 * (D) 同步資料表 & 啟動伺服器
 * ================================
 */
sequelize.sync({ alter: false })
  .then(() => {
    console.log('All tables synced!');
    app.listen(PORT, HOST, () => {
      console.log(`Express server is running on http://${HOST}:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to sync tables:', err);
  });
