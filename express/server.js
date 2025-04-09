require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// 1) 建立 Express App
const app = express();

// 2) 基本中介層（Middleware）
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// 3) 健康檢查 (GET /health)
//   前端可呼叫: fetch('/health') => 檢查服務是否存活
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'express' });
});

// -----------------------------------------
// 4) 匯入各路由（routes/*.js）
//    **請確認這些檔案都已經存在**，並確保匯入路徑正確。
// -----------------------------------------
const authRouter         = require('./routes/auth');            // ★ 重點：加上這行
const infringementRouter = require('./routes/infringement');
const blockchainRouter   = require('./routes/blockchain');
const paymentRouter      = require('./routes/ExpressRootPayment');
const platformRouter     = require('./routes/platform');
const profilesRouter     = require('./routes/profiles');
const uploadRouter       = require('./routes/upload');

// -----------------------------------------
// 5) 綁定路由前綴 => 對應前端呼叫方式
// -----------------------------------------

// (A) 使用者 Auth => 前端路徑: /api/auth/...
//     - 註冊: POST /api/auth/register
//     - 登入: POST /api/auth/login
app.use('/api/auth', authRouter);

// (B) 侵權相關 => /api/infr/...
app.use('/api/infr', infringementRouter);

// (C) 區塊鏈 => /api/chain/...
app.use('/api/chain', blockchainRouter);

// (D) 付款 => /api/payment/...
app.use('/api/payment', paymentRouter);

// (E) 平台帳號 => /api/platform/...
app.use('/api/platform', platformRouter);

// (F) Profiles => /api/profiles/...
app.use('/api/profiles', profilesRouter);

// (G) 檔案上傳 => /api/upload/...
app.use('/api/upload', uploadRouter);

// 6) 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Express listening on port ${PORT}`);
});
