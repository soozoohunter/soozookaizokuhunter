const express = require('express');
require('dotenv').config();
const { sequelize } = require('./models/User');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// 解析 JSON 請求
app.use(express.json());

// 測試資料庫連線並同步模型
sequelize.authenticate()
  .then(() => {
    console.log('Database connected.');
    // 同步模型到資料庫：若表不存在則建立，若有新欄位則嘗試更新
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database synchronized.');
  })
  .catch(err => {
    console.error('Database connection/sync error:', err);
  });

// 掛載認證路由，統一使用 /api 作為前綴
app.use('/api', authRoutes);

// 啟動 Express 伺服器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
