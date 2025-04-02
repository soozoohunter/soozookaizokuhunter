require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db');

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

const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');
const infrRouter = require('./routes/infringement');
const platformRouter = require('./routes/platform');
const blockchainRouter = require('./routes/blockchain');
const paymentRouter = require('./routes/ExpressRootPayment');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

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
app.use('/api/payment', paymentRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Express - Hunter X' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 定期推送「已抓到多少侵權」資訊
setInterval(async () => {
  try {
    const count = await Infringement.count();
    io.emit('infrCountUpdate', { total: count });
  } catch (err) {
    console.error('推送失敗:', err);
  }
}, 5000);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 啟動
(async () => {
  try {
    await db.authenticate();
    console.log('PostgreSQL 連線成功');
  } catch (err) {
    console.error('DB connect fail:', err.message);
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Express+Socket.IO 服務已啟動，port=${PORT}`);
  });
})();
