// 文件路徑: express/server.js

require('dotenv').config();
const express = require('express');
const path = require('path');

// 匯入區塊鏈功能函式 (chain.js)
const chain = require('./utils/chain');
// 匯入 auth 路由
const authRouter = require('./routes/auth');

const app = express();
// 監聽 0.0.0.0，避免只綁在 127.0.0.1
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

// 解析 JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check (供 Docker Healthcheck 或監控)
 */
app.get('/health', (req, res) => {
  res.json({ message: 'Server healthy' });
});

/**
 * ================================
 * (A) 掛載 auth 路由: /auth
 * ================================
 * 外部打 /api/auth/... → 內部對應 /auth/...
 */
app.use('/auth', authRouter);

/**
 * ================================
 * (B) 區塊鏈 => /chain/...
 * ================================
 * 外部打 /api/chain/... → 內部對應 /chain/...
 */

// (1) 寫入任意字串 => POST /chain/store
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

// (2) 寫入使用者上傳的檔案資訊 => POST /chain/writeUserAsset
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

// (3) 寫入侵權資訊 => POST /chain/writeInfringement
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
 * 啟動 Express 服務 (使用 0.0.0.0)
 */
app.listen(PORT, HOST, () => {
  console.log(`Express server is running on http://${HOST}:${PORT}`);
});
