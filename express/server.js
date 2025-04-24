/*************************************************************
 * express/server.js (最終版, 使用 alter:true 直接同步)
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const createAdmin = require('./createDefaultAdmin');

// ★ 改用 'paymentRoutes' (正確路徑)
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
app.use('/api', paymentRoutes);       // e.g. /api/pricing, /api/purchase
app.use('/api/protect', protectRouter);
app.use('/admin', adminRouter);
app.use('/auth', authRouter);

// DB 連線 & 同步
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[Express] Sequelize connected.');

    // ★★ 開發 or 簡易解法：使用 sync({ alter: true }) 直接更新表結構
    //    (正式上線環境建議用 Migration，這裡為了快速修正欄位缺漏先用此法)
    await sequelize.sync({ alter: true });
    console.log('[Express] Sequelize synced (alter:true).');

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
