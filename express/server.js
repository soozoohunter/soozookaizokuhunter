require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// 健康檢查 => /health
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "express" });
});

// 範例：掛載 /api/* 路由
const authRouter = require('./routes/auth');
const infringementRouter = require('./routes/infringement');
const uploadRouter = require('./routes/upload');
// ... 其它 routes

// 在 Express 內部以 /api 開頭
app.use("/api/auth", authRouter);
app.use("/api/infr", infringementRouter);
app.use("/api/upload", uploadRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}`);
});
