/*************************************************************
 * express/server.js (最終整合版本)
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const createAdmin = require('./createDefaultAdmin');

// 路由
const paymentsRouter = require('./routes/payment');
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// 簡易健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK (Sequelize Version)');
});

// 路由掛載
app.use('/api', paymentsRouter);         // /api/pricing, /api/purchase, ...
app.use('/api/protect', protectRouter);  // /api/protect/step1 ...
app.use('/admin', adminRouter);          // /admin/users, /admin/files ...
app.use('/auth', authRoutes);            // /auth/login, /auth/register ...

// DB 連線檢查 (選擇性同步)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[Express] Sequelize connected.');

    // ★ 開發階段若要自動更新資料表，可放開:
    // await sequelize.sync({ alter: true });
    // console.log('[Express] Sequelize synced.');
  } catch (err) {
    console.error('[Express] Sequelize connect error:', err);
  }
})();

// 建立預設Admin (非必要)
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
