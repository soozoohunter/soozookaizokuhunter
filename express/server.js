// express/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 匯入剛才定義的 pg Pool 連線 (./db.js)
const db = require('./db');

// 引入付款路由 (使用 pg Pool)
const paymentsRouter = require('./routes/payment'); // 假設檔名為 payment.js

const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK');
});

// 在進入路由之前，將 db 放到 req，讓路由可使用 req.db.query(...)
app.use((req, res, next) => {
  req.db = db;
  next();
});

// 付款路由 => /api
app.use('/api', paymentsRouter);

// 若您有其他路由，可繼續掛載
// app.use('/auth', authRoutes);
// app.use('/upload', uploadRoutes);
// ...

// 最後啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] running on port ${PORT}`);
});
