/********************************************************************
 * server.js (最終整合版)
 * 讀取 .env, 連 PostgreSQL (Sequelize), 啟動 Express, 掛載路由
 ********************************************************************/
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // ./models/index.js

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由匯入
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const trademarkRoutes = require('./routes/trademarkRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
// 也可加入 user profile / infringement / membership ...
// const userRoutes = require('./routes/userRoutes');
// const infringementRoutes = require('./routes/infringementRoutes');

// 健康檢查
app.get('/health', (req, res) => {
  res.send(`Express server healthy - DB: ${process.env.POSTGRES_DB}, Chain: ${process.env.BLOCKCHAIN_RPC_URL}`);
});

// 註冊各個路由 (注意前綴)
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/trademarks', trademarkRoutes);
app.use('/api/payment', paymentRoutes);

// 若有其他路由...
// app.use('/api/infringement', infringementRoutes);

// 初始化 Sequelize & 啟動
sequelize.sync({ alter: false })
  .then(() => {
    console.log('All tables synced!');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to sync tables:', err);
  });
