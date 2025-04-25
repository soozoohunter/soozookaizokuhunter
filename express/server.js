/*************************************************************
 * express/server.js
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const createAdmin = require('./createDefaultAdmin');

// 如果您有其他 routes
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
app.use('/api', paymentRoutes);
app.use('/api/protect', protectRouter);
app.use('/admin', adminRouter);
app.use('/auth', authRouter);

// DB 連線 & 同步
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[Express] Sequelize connected.');

    // ---------- 方式1: alter:true 自動嘗試更新(不保證成功) ----------
    // await sequelize.sync({ alter: true });

    // ---------- 方式2: force:true 會直接重建資料表, 所有資料會被刪除! ----------
    // await sequelize.sync({ force: true });

    // 建議只在測試或本地用 force:true 或手動 drop table
    // 兩者只能擇一，不要同時開
    await sequelize.sync({ alter: true });
    console.log('[Express] Sequelize synced.');

    // 建立/更新預設 Admin
    await createAdmin();

  } catch (err) {
    console.error('[Express] Sequelize connect error:', err);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] running on port ${PORT}`);
});
