/*************************************************************
 * express/server.js (最終版範例)
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, User } = require('./models'); 
// ↑ 用 ./models/index.js 匯出的 sequelize instance 與 Model
const createAdmin = require('./createDefaultAdmin');

// 路由
const paymentsRouter = require('./routes/payment');
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const authRoutes = require('./routes/authRoutes');

// 其他套件
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// 簡易健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK (Sequelize Version)');
});

// 路由掛載
app.use('/api', paymentsRouter);
app.use('/api/protect', protectRouter);
app.use('/admin', adminRouter);
app.use('/auth', authRoutes);

// 啟動前檢查資料庫連線 & 同步
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[Express] Sequelize connected.');
    // 若要自動建立 / 更新資料表:
    // await sequelize.sync({ alter: true });
    // console.log('[Express] Sequelize synced.');
  } catch (err) {
    console.error('[Express] Sequelize connect error:', err);
  }
})();

// 建立預設Admin (非必要，但若原本有)
(async function ensureAdmin() {
  try {
    await createAdmin(); // 讓 createDefaultAdmin.js 處理
  } catch (err) {
    console.error('[InitAdmin] 建立管理員失敗:', err);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] running on port ${PORT}`);
});
