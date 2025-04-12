require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 若使用資料庫
// const sequelize = require('./db'); // or any db config

const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ message: 'Express healthy' });
});

// 路由
const authRouter = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const uploadRouter = require('./routes/upload');
// etc...

app.use('/auth', authRouter);
app.use('/membership', membershipRouter);
app.use('/upload', uploadRouter);

// 啟動
// 若使用資料庫: sequelize.sync().then(...)
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
