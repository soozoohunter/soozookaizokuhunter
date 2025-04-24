/*************************************************************
 * express/server.js (最終版) - 改用 paymentRoutes.js
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const createAdmin = require('./createDefaultAdmin');

// ★ 改成正確路徑名稱 'paymentRoutes'
const paymentRoutes = require('./routes/paymentRoutes'); 
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/authRoutes');

const app = express();

// 中介層
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK (Production Version)');
});

// 掛載各路由
app.use('/api', paymentRoutes);       // e.g. /api/pricing, /api/purchase...
app.use('/api/protect', protectRouter);
app.use('/admin', adminRouter);
app.use('/auth', authRouter);

// DB 連線 & 同步
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[Express] Sequelize connected.');

    // 開發測試時可使用 sync({ alter: true })，自動更新欄位；正式環境建議移除或使用 migration
    await sequelize.sync({ alter: true });
    console.log('[Express] Sequelize synced.');
  } catch (err) {
    console.error('[Express] Sequelize connect error:', err);
  }
})();

// 建立預設 Admin
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
