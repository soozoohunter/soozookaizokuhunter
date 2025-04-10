// express/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const sequelize = require('./db');

// Model - 確保載入
const User = require('./models/User');
const PlatformAccount = require('./models/PlatformAccount');

// utils/chain
const chain = require('./utils/chain');

// 路由
const authRouter = require('./routes/auth');
const profilesRouter = require('./routes/profiles'); // 會員中心 / 平台帳號
//(如果需要 chainRouter, 您可新增 e.g. require('./routes/chainRouter'))

const app = express();
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

// 基本健康檢查
app.get('/health', (req, res) => {
  res.json({ message:'Server healthy' });
});

// 解析 JSON / URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** ================ 路由掛載 ================ */

// /auth => authRouter
app.use('/auth', authRouter);

// /profiles => profilesRouter
app.use('/profiles', profilesRouter);

// 若要保留 /chain => 直接加
app.post('/chain/store', async(req,res)=>{
  try{
    const { data } = req.body;
    if(!data){
      return res.status(400).json({ error:'Missing data' });
    }
    const txHash = await chain.writeToBlockchain(data);
    res.json({ success:true, txHash });
  }catch(e){
    res.status(500).json({ error:e.message });
  }
});

/** ================ 同步 DB & 啟動 ================ */
sequelize.sync({ alter:true })
  .then(()=>{
    console.log('All tables synced!');
    app.listen(PORT, HOST, ()=>{
      console.log(`Express server is running on http://${HOST}:${PORT}`);
    });
  })
  .catch(err=>{
    console.error('Unable to sync tables:', err);
  });
