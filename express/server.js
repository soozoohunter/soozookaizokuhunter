require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');

// Models
const User = require('./models/User');
const PlatformAccount = require('./models/PlatformAccount');
// 其他 models (Works, Infringement) 可依需要import

// 建立關聯 (一對多: 1位User可擁有多個PlatformAccount)
User.hasMany(PlatformAccount, { foreignKey: 'userId' });
PlatformAccount.belongsTo(User, { foreignKey: 'userId' });

// 路由
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');
const infrRouter = require('./routes/infringement');
const platformRouter = require('./routes/platform');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

// rate-limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '請求次數過多，請稍後再試'
});
app.use(limiter);

// 路由掛載
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/infr', infrRouter);
app.use('/api/platform', platformRouter);

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Express VSS final+Platform' });
});

// 啟動
(async () => {
  try {
    await db.authenticate();
    console.log('PostgreSQL 連線成功');
    // 同步資料表 (若 init.sql 已建表，也可改成 db.sync({ alter:true }) or force:false)
    await db.sync();

  } catch (e) {
    console.error('DB connect fail:', e.message);
  }
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Express listening on port ${PORT}`);
  });
})();
