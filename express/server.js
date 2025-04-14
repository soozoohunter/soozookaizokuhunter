/********************************************************************
 * express/server.js (最終整合版) 
 * - 移除驗證碼 / sendCode / checkCode
 * - 同時掛載您需要的其他路由
 ********************************************************************/
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const { sequelize } = require('./models');
const User = require('./models/User'); 

// 區塊鏈
const chain = require('./utils/chain');

// 建立 App
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由 import
const authRouter = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const profileRouter = require('./routes/profile');
const paymentRouter = require('./routes/payment');
const infringementRouter = require('./routes/infringement');
const trademarkRouter = require('./routes/trademarkCheck');
const contactRouter = require('./routes/contact');
const uploadRouter = require('./routes/upload');  // 若有

app.use('/auth', authRouter);
app.use('/membership', membershipRouter);
app.use('/profile', profileRouter);
app.use('/payment', paymentRouter);
app.use('/infringement', infringementRouter);
app.use('/api/trademark-check', trademarkRouter);
app.use('/api/contact', contactRouter);
app.use('/api/upload', uploadRouter); // 若您把上傳功能抽成單一路由

// 健康檢查
app.get('/health', (req, res) => res.send('Express server healthy'));

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
