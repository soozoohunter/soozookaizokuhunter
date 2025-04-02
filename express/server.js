require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');

// models
const User = require('./models/User');
const PlatformAccount = require('./models/PlatformAccount');
const Work = require('./models/Work');
const Infringement = require('./models/Infringement');

// 建立關聯
User.hasMany(PlatformAccount, { foreignKey: 'userId' });
PlatformAccount.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Work, { foreignKey: 'userId' });
Work.belongsTo(User, { foreignKey: 'userId' });

Work.hasMany(Infringement, { foreignKey: 'workId' });
Infringement.belongsTo(Work, { foreignKey: 'workId' });

// routes
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');
const infrRouter = require('./routes/infringement');
const platformRouter = require('./routes/platform');
const blockchainRouter = require('./routes/blockchain');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

// rate-limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: '請求過多，稍後再試'
});
app.use(limiter);

// 掛載路由
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/infr', infrRouter);
app.use('/api/platform', platformRouter);
app.use('/api/chain', blockchainRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Express Kaikaishield X' });
});

(async () => {
  try {
    await db.authenticate();
    console.log('PostgreSQL 連線成功');
    // 若 init.sql 已建立表，也可以酌情使用 sync
    // await db.sync({ alter: true });
  } catch (err) {
    console.error('DB connect fail:', err.message);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Express API 服務已啟動，port=${PORT}`);
  });
})();
