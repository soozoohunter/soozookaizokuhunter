// 文件路徑: express/server.js

require('dotenv').config();
const express = require('express');
const path = require('path');

// 這裡匯入剛剛的 chain.js 功能
const chain = require('./utils/chain');

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON 請求
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * (例) Health check
 * 可以提供給 Docker healthcheck 或其他監控使用
 */
app.get('/health', (req, res) => {
  res.json({ message: 'Server healthy' });
});

/**
 * ================================
 * (C) 區塊鏈 => /api/chain/...
 * ================================
 * 原本在 server.js 第 44~45 行的 `app.use('/api/chain', blockchainRouter)`
 * 會噴錯是因為 blockchainRouter 實際上是一個「Object」。 
 * 
 * 現在改用「直接定義路由 + 呼叫 chain.js 函式」的方式：
 */

// (1) 寫入任意字串 => POST /api/chain/store
app.post('/api/chain/store', async (req, res) => {
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

// (2) 寫入使用者上傳的檔案資訊 => POST /api/chain/writeUserAsset
app.post('/api/chain/writeUserAsset', async (req, res) => {
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

// (3) 寫入侵權資訊 => POST /api/chain/writeInfringement
app.post('/api/chain/writeInfringement', async (req, res) => {
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
 * 啟動伺服器
 */
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});
