/********************************************************************
 * server.js
 * - 載入 .env
 * - 連 PostgreSQL (Sequelize)，自動建表
 * - 啟動 Express
 * - 掛載所有路由
 * - (若有需要) createDefaultAdmin 建管理員帳號
 * - 最後開始監聽
 ********************************************************************/
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const db = require('./models'); // 連線 & Model 整合檔
// const { createDefaultAdmin } = require('./createDefaultAdmin');
// const blockchainService = require('./services/blockchainService');
// const authMiddleware = require('./middleware/authMiddleware');
// const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
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

// 路由掛載
// app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
// ... 其餘路由依需求掛載

// 同步 Sequelize
db.sequelize.sync({ alter: false })
  .then(async () => {
    console.log('[server.js] All tables synced!');
    // if (createDefaultAdmin) await createDefaultAdmin();

    const PORT = process.env.PORT || 3000;
    // 在容器內監聽 0.0.0.0
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[server.js] Unable to sync tables:', err);
  });
