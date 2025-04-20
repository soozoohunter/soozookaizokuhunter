/**
 * express/server.js
 * - 讀取 .env
 * - 連 PostgreSQL (Sequelize)
 * - 啟動 Express
 * - 掛載路由 (auth, etc.)
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// 同層 => './models'
const db = require('./models');
const { sequelize } = db;

// 路由
const authRoutes = require('./routes/auth');
// const uploadRoutes = require('./routes/upload');
// const membershipRoutes = require('./routes/membership');
// ... 依您實際專案狀況添加

const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK');
});

// 掛載路由 (如 /auth)
app.use('/auth', authRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use('/api/membership', membershipRoutes);

sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('[server.js] Sequelize synced.');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[server.js] Express running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server.js] sync error:', err);
  });
