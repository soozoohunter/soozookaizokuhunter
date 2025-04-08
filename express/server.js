// express/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// 基本中介
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// 健康檢查 => /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'express' });
});

// 匯入各路由
const authRouter = require('./routes/auth');
const infringementRouter = require('./routes/infringement');
const blockchainRouter = require('./routes/blockchain');
const paymentRouter = require('./routes/ExpressRootPayment'); // Stripe
const platformRouter = require('./routes/platform');
const profilesRouter = require('./routes/profiles');
const uploadRouter = require('./routes/upload'); 
// ... 其他路由如您有

// 綁定路由前綴
app.use('/api/auth', authRouter);
app.use('/api/infr', infringementRouter);
app.use('/api/chain', blockchainRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/platform', platformRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/upload', uploadRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}`);
});
