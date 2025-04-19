/**
 * express/server.js
 * - 載入 .env
 * - 連 PostgreSQL (Sequelize)
 * - 啟動 Express
 * - 掛載路由 (auth, etc.)
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// ★ 如果有在 models/index.js 裡 export { sequelize, User, ... }
const db = require('./models');
const { sequelize } = db;

const authRoutes = require('./routes/auth');
// const uploadRoutes = require('./routes/upload');
// const membershipRoutes = require('./routes/membership');

const app = express();

// 中介軟體
app.use(cors());
app.use(express.json());

// 簡易健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK');
});

// 掛載路由
app.use('/auth', authRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use('/api/membership', membershipRoutes);

// 與資料庫同步 (alter: false => 不自動更新 schema，若需自動更新可改 true)
sequelize.sync({ alter: false })
  .then(() => {
    console.log('[server.js] Sequelize synced.');
    const PORT = process.env.PORT || 3000;
    // ★ 監聽 0.0.0.0 才能讓 Docker 內部網路連線
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server.js] sync error:', err);
  });
