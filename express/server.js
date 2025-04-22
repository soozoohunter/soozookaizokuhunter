require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 若您有 sequelize models
const { sequelize } = require('./models');

// 若您想用 pg Pool (db.js)
const db = require('./db');

// 引入您可能已有的路由 (auth, upload, contact…)
const authRoutes = require('./routes/auth');

// 引入付款路由 (使用 pg Pool)
const paymentsRouter = require('./routes/payments');

const app = express();

// 啟用 CORS
app.use(cors());

// 解析 JSON 請求
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK');
});

// 在進入路由前，把 pg Pool 附加到 req.db
app.use((req, res, next) => {
  req.db = db;
  next();
});

// 1) 認證路由 (Sequelize)
app.use('/auth', authRoutes);

// 2) 付款路由 (pg Pool)
app.use('/api', paymentsRouter);

// 3) 其他路由 (如: contactRoutes, uploadRoutes…)
// app.use('/contact', contactRoutes);
// app.use('/upload', uploadRoutes);
// ...

// 最後: Sequelize 同步並啟動
sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('[server.js] Sequelize synced.');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server.js] sync error:', err);
  });
