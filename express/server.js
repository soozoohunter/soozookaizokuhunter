require('dotenv').config();
const express = require('express');
const cors = require('cors');

// (可選) 若使用 Sequelize
// const sequelize = require('./db'); 

const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health',(req,res)=>res.json({ message:'Express healthy' }));

// Routes
const authRouter = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const uploadRouter = require('./routes/upload');
// 若您原本有 infringement, profiles 等, 繼續保留:
/// const infringementRouter = require('./routes/infringement');
/// const profilesRouter = require('./routes/profiles');

app.use('/auth', authRouter);
app.use('/membership', membershipRouter);
app.use('/upload', uploadRouter);
// app.use('/infringement', infringementRouter);
// app.use('/profiles', profilesRouter);

// 資料庫同步 (若使用 Sequelize)
/*
sequelize.sync({ alter:false })
  .then(()=>{
    console.log('All tables synced!');
    app.listen(PORT, ()=> console.log(`Express running on port ${PORT}`));
  })
  .catch(err=> console.error('DB sync error:', err));
*/

// 若沒使用 DB, 直接啟動:
app.listen(PORT, ()=>{
  console.log(`Express server running on port ${PORT}`);
});
