// express/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./db');

// 路由
const authRouter = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const uploadRouter = require('./routes/upload');
const profilesRouter = require('./routes/profiles');
const infringementRouter = require('./routes/infringement');
// ... (payment, trademark, crawlerRoute 等)

// 建立 App
const app = express();
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

// Health
app.get('/health', (req,res)=>res.json({ message:'Server healthy' }));

// 路由綁定
app.use('/auth', authRouter);
app.use('/membership', membershipRouter);
app.use('/upload', uploadRouter);
app.use('/profiles', profilesRouter);
app.use('/infringement', infringementRouter);

// 同步資料庫
sequelize.sync({ alter:false })
  .then(()=>{
    console.log('All tables synced!');
    app.listen(PORT, HOST, ()=>{
      console.log(`Express server is running on http://${HOST}:${PORT}`);
    });
  })
  .catch(err=>{
    console.error('Unable to sync tables:', err);
  });
