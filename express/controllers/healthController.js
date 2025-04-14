// controllers/healthController.js
const mongoose = require('mongoose');
const axios = require('axios');
const ipfsService = require('../services/ipfsService');
const healthController = {
  check: async (req, res) => {
    // 預設狀態
    const status = {
      db: false,
      ipfs: false,
      blockchain: false,
      fastApi: false
    };
    // 1. 檢查資料庫連線
    status.db = mongoose.connection.readyState === 1;  // 1 表示 connected
    // 2. 檢查 IPFS 節點（嘗試呼叫 id 指令）
    try {
      const id = await ipfsService.ipfs.id();  // 如果ipfsService匯出ipfs實例
      status.ipfs = !!id;
    } catch (e) {
      status.ipfs = false;
    }
    // 3. 檢查區塊鏈節點（例如獲取當前區塊號）
    const blockchain = require('../services/blockchainService');
    try {
      const blockNumber = await blockchain.getCurrentBlock();
      status.blockchain = (typeof blockNumber === 'number');
    } catch (e) {
      status.blockchain = false;
    }
    // 4. 檢查 FastAPI 服務
    try {
      await axios.get(`${process.env.FASTAPI_URL}/health`);
      status.fastApi = true;
    } catch (e) {
      status.fastApi = false;
    }
    // 如果需要，可添加其他檢查，例如第三方API的可用性等
    const allHealthy = status.db && status.ipfs && status.blockchain && status.fastApi;
    return res.json({ healthy: allHealthy, services: status });
  }
};
module.exports = healthController;
