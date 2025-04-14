/********************************************************************
 * express/server.js (最終整合版)
 * 使用 cors/json/urlencoded，掛載 /auth, /membership... 路由
 * 移除舊驗證碼/多步註冊
 ********************************************************************/
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');

const { sequelize } = require('./models');
const User = require('./models/User'); // 假如您需要在這裡用到

// 區塊鏈(如需)
const chain = require('./utils/chain');

// 建立 Express App
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 載入路由
const authRouter = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const profileRouter = require('./routes/profile');
const paymentRouter = require('./routes/payment');
const infringementRouter = require('./routes/infringement');
const trademarkRouter = require('./routes/trademarkCheck');
const contactRouter = require('./routes/contact');
const uploadRouter = require('./routes/upload');

// 掛載路由
app.use('/auth', authRouter);
app.use('/membership', membershipRouter);
app.use('/profile', profileRouter);
app.use('/payment', paymentRouter);
app.use('/infringement', infringementRouter);
app.use('/api/trademark-check', trademarkRouter);
app.use('/api/contact', contactRouter);
app.use('/api/upload', uploadRouter);

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express server healthy');
});

// 啟動
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
