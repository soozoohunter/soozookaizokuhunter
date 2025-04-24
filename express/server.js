/*************************************************************
 * express/server.js (最終整合版，企業生產級)
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const createAdmin = require('./createDefaultAdmin');

// 路由
const paymentRouter = require('./routes/payment');
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK (Production Version)');
});

// 掛載各路由
app.use('/api', paymentRouter);
app.use('/api/protect', protectRouter);
app.use('/admin', adminRouter);
app.use('/auth', authRouter);

// DB 連線 & (選擇性)同步
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[Express] Sequelize connected.');

    // 在正式生產環境，建議使用 Migration，而非 sync
    // await sequelize.sync({ alter: true }); 
    // console.log('[Express] Sequelize synced.');
  } catch (err) {
    console.error('[Express] Sequelize connect error:', err);
  }
})();

// 建立預設Admin
(async function ensureAdmin() {
  try {
    await createAdmin(); // createDefaultAdmin.js
  } catch (err) {
    console.error('[InitAdmin] 建立管理員失敗:', err);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] running on port ${PORT}`);
});
