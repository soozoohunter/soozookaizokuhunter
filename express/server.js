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

// ★ 修正：請用 './models' (同層資料夾)
const db = require('./models'); 
const { sequelize } = db;

// 路由
const authRoutes = require('./routes/auth');
// const uploadRoutes = require('./routes/upload');
// const membershipRoutes = require('./routes/membership');
// ... 視需求添加

const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK');
});

// 掛載路由 (示範：/auth)
app.use('/auth', authRoutes);

// 若有其他路由:
// app.use('/api/upload', uploadRoutes);
// app.use('/api/membership', membershipRoutes);

sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('[server.js] Sequelize synced.');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server.js] sync error:', err);
  });
