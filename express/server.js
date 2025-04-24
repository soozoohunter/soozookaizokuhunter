/*************************************************************
 * express/server.js (最終整合版)
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const createAdmin = require('./createDefaultAdmin');

// 路由
const paymentRouter = require('./routes/paymentRoutes');
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK (Sequelize Version)');
});

// 路由掛載
app.use('/api', paymentRouter);         // => /api/pricing, /api/purchase ...
app.use('/api/protect', protectRouter);// => /api/protect/step1 ...
app.use('/admin', adminRouter);        // => /admin/login, /admin/files ...
app.use('/auth', authRoutes);          // => /auth/login, /auth/register ...

// DB連線 & 同步
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[Express] Sequelize connected.');

    // 開發測試階段 => sync
    // 生產環境建議使用 Migration
    await sequelize.sync({ alter: true });
    console.log('[Express] Sequelize synced.');
  } catch (err) {
    console.error('[Express] Sequelize connect error:', err);
  }
})();

// 建立預設Admin
(async function ensureAdmin() {
  try {
    await createAdmin();
  } catch (err) {
    console.error('[InitAdmin] 建立管理員失敗:', err);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] running on port ${PORT}`);
});
