'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

// 載入 models/index.js
const db = require('./models');

// 如果有需要可載入 createDefaultAdmin、blockchainService 等
// const { createDefaultAdmin } = require('./createDefaultAdmin');
// const blockchainService = require('./services/blockchainService');

// 路由
const authMiddleware = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
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

// 同步資料表 & 啟動 Express
db.sequelize.sync({ alter: false })
  .then(async () => {
    console.log('[server.js] All tables synced!');

    // 若有預設管理員邏輯
    // if (createDefaultAdmin) await createDefaultAdmin();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[server.js] Express running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[server.js] Unable to sync tables:', err);
  });
