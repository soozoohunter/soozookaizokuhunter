require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// 1) 匯入 DB & 區塊鏈
const sequelize = require('./db'); 
const chain = require('./utils/chain');

// 2) 匯入 auth 路由 (提供 /auth/*)
const authRouter = require('./routes/auth');

// 3) 建立 Express app
const app = express();

// 監聽 0.0.0.0，避免只綁 127.0.0.1
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

// 解析 JSON/URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health Check (供 Docker Healthcheck)
 */
app.get('/health', (req, res) => {
  res.json({ message: 'Server healthy' });
});

/**
 * ================================
 * (A) Auth 路由 /auth
 * ================================
 * 前端打 /api/auth/... => 這裡對應 /auth/...
 */
app.use('/auth', authRouter);

/**
 * ================================
 * (B) 區塊鏈 => /chain/...
 * ================================
 * (1) 寫入任意字串 => POST /chain/store
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

/**
 * (2) 寫入使用者資產 => POST /chain/writeUserAsset
 */
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

/**
 * (3) 寫入侵權資訊 => POST /chain/writeInfringement
 */
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
 * (C) 檔案上傳 => /api/upload
 * ================================
 * 直接在 server.js 寫上 Multer + JWT 驗證
 */
const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// JWT 驗證中介層 (若需要保護上傳API)
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/,'');
    if (!token) {
      return res.status(401).json({ error: '尚未登入或缺少 Token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, ... }
    next();
  } catch(e) {
    console.error('Token 驗證失敗:', e);
    return res.status(401).json({ error: 'Token 無效或已過期' });
  }
}

// POST /api/upload
app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error:'沒有檔案' });
    }
    // e.g. 取得 userEmail => req.user.email
    const userEmail = req.user.email || 'unknown@domain.com';

    // 讀取檔案buffer
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);

    // 建立 md5 指紋
    const fingerprint = crypto.createHash('md5').update(buffer).digest('hex');

    // (可選) 上鏈 => e.g.  userEmail|fingerprint
    try {
      const txHash = await chain.writeToBlockchain(`${userEmail}|${fingerprint}`);
      console.log('[Upload] 上鏈成功 =>', txHash);
    } catch(chainErr) {
      console.error('[Upload] 上鏈失敗 =>', chainErr);
    }

    // 刪除暫存檔
    fs.unlinkSync(filePath);

    return res.json({
      message: '上傳成功',
      fileName: req.file.originalname,
      fingerprint
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ error: err.message });
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
