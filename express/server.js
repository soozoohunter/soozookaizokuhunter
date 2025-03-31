// express/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');

// 掛載路由
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');
const infrRouter = require('./routes/infringement');

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*'
}));
app.use(rateLimit({
  windowMs: 15*60*1000,
  max:100
}));

// 路由
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/infr', infrRouter);

// health
app.get('/health',(req,res)=>{
  res.json({status:'ok',service:'ExpressV1Ultimate'});
});

(async()=>{
  try{
    await db.authenticate();
    console.log('PostgreSQL 連線成功');
    await db.sync();
  }catch(e){
    console.error('DB連線失敗:', e.message);
  }
  const PORT = 3000;
  app.listen(PORT,()=>{
    console.log(`Express V1 Ultimate on port ${PORT}`);
  });
})();
