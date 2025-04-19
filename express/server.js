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
// 使用 models/index.js 作為連線 & Model 整合檔
const db = require('./models'); 

// 其他可能的 import (可視需要解除註解):
// const { createDefaultAdmin } = require('./createDefaultAdmin');
// const blockchainService = require('./services/blockchainService');
// const authMiddleware = require('./middleware/authMiddleware');
// const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
// const trademarkRoutes = require('./routes/trademarkRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// 中介軟體
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查路由
app.get('/health', (req, res) => {
  res.send(`Express server healthy - DB: ${process.env.POSTGRES_DB}`);
});

// 路由掛載
// app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
// (若有 trademarkRoutes, paymentRoutes 等, 於此掛載)

// 同步 Sequelize，啟動 Express
db.sequelize.sync({ alter: false })
  .then(async () => {
    console.log('[server.js] All tables synced!');

    // 若需要建立預設管理員:
    // if (createDefaultAdmin) {
    //   await createDefaultAdmin();
    // }

    const PORT = process.env.PORT || 3000;
    // 監聽 0.0.0.0 以便在 Docker 容器內對外提供服務
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[server.js] Unable to sync tables:', err);
  });
