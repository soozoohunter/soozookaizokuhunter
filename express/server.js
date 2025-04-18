/********************************************************************
 * server.js
 * - 載入 .env
 * - 連 PostgreSQL (Sequelize)，自動建表
 * - 啟動 Express，載入區塊鏈服務
 * - 掛載所有路由
 * - 自動呼叫 createDefaultAdmin 建管理員帳號 (若有)
 * - 最後開始監聽
 ********************************************************************/
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
// 如果有 createDefaultAdmin 就引入
// const { createDefaultAdmin } = require('./createDefaultAdmin'); 
// const blockchainService = require('./services/blockchainService'); // 如有需要可引入

const authMiddleware = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
// 其他路由 (ex: trademarkRoutes, paymentRoutes)
// const trademarkRoutes = require('./routes/trademarkRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
  res.send(`Express server healthy - DB: ${process.env.POSTGRES_DB}`);
});

// ========================
// 路由掛載
// ========================
// 例：app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
// 若您還有 /api/trademarks, /api/payment, /auth, /admin 等路由，可在此追加

// 同步 Sequelize，啟動 server
sequelize.sync({ alter: false })
  .then(async () => {
    console.log('[server.js] All tables synced!');

    // 如果您有 createDefaultAdmin，這裡可呼叫
    // if (createDefaultAdmin) {
    //   await createDefaultAdmin();
    // }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[server.js] Express running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[server.js] Unable to sync tables:', err);
  });
