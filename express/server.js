/**
 * express/server.js (修正版，不傷原本結構)
 *
 * - 讀取 .env
 * - 連 PostgreSQL (Sequelize)
 * - 啟動 Express
 * - [保留您原本的邏輯/程式]
 * - 掛載路由 (auth, membership, upload... etc.)
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

// ★ 修正: 改為 './models'，確保跟 server.js 同層。
const db = require('./models'); 
const { sequelize } = db;

// 如果您有其他原生 pg client / ethers 區塊鏈 init 等，可在此繼續保留
// const { Client } = require('pg');
// const { ethers } = require('ethers');
// ...省略

// 路由
const authRoutes = require('./routes/auth');
// const uploadRoutes = require('./routes/upload');
// const membershipRoutes = require('./routes/membership');
// ... 視您的專案需求自行保留或新增

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== 健康檢查 /health ==================
app.get('/health', (req, res) => {
  res.json({ status: 'Express OK', env: process.env.NODE_ENV || 'dev' });
});

// ================== 掛載路由 ==================
app.use('/auth', authRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use('/api/membership', membershipRoutes);
// ...如您有更多 API 路由也在此掛載

// ================== 保留您原有的區塊鏈初始化 / pg client 初始化 / 其他程式碼 ================
// (如果您有就保留，以下只是示範位置)
// function initBlockchain() {...}
// initBlockchain();  // 例如

// ================== 同步 Sequelize + 啟動 ==================
sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('[server.js] PostgreSQL + Sequelize synced!');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server.js] sync error:', err);
  });
