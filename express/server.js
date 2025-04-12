// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./db');

// 路由
const authRouter = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const paymentRouter = require('./routes/payment');
const uploadRouter = require('./routes/upload');
const profilesRouter = require('./routes/profiles');
const infringementRouter = require('./routes/infringement');
const trademarkRouter = require('./routes/trademark'); // 若有
const trademarkCheckRoutes = require('./routes/trademarkCheck'); // 新增

const app = express();
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查路由
app.get('/health', (req, res) => {
  res.json({ message: 'Server healthy' });
});

// 綁定既有路由
app.use('/auth', authRouter);
app.use('/membership', membershipRouter);
app.use('/payment', paymentRouter);
app.use('/upload', uploadRouter);
app.use('/profiles', profilesRouter);
app.use('/infringement', infringementRouter);
app.use('/trademark', trademarkRouter); // 若實際實作

// 新增掛載 trademarkCheckRoutes：提供 /api/trademark-check/... 的爬蟲 API
app.use('/api/trademark-check', trademarkCheckRoutes);

// 同步資料庫 (Sequelize)
sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('All tables synced!');
    app.listen(PORT, HOST, () => {
      console.log(`Express server running on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to sync tables:', err);
  });
