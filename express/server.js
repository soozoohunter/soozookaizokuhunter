/************************************************
 * express/server.js - VVS 最終整合版本
 ************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');

// 導入路由
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');
const infrRouter = require('./routes/infringement');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*'
}));

// rate-limit
const limiter = rateLimit({
  windowMs: 15*60*1000, // 15分鐘
  max: 100,
  message: '請求次數過多，請稍後再試'
});
app.use(limiter);

// 路由掛載
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/infr', infrRouter);

// 健康檢查
app.get('/health',(req,res)=>{
  res.json({ status:'ok', service:'Express VVS' });
});

// DB init
(async()=>{
  try{
    await db.authenticate();
    console.log('PostgreSQL 連線成功 (VVS)');
    await db.sync();
  } catch(e){
    console.error('DB connect fail:', e.message);
  }

  const PORT = process.env.PORT||3000;
  app.listen(PORT,()=>{
    console.log(`Express VVS listening on ${PORT}`);
  });
})();
