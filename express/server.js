/********************************************************************
 * server.js (最終整合版)
 * - 載入 .env
 * - 連 PostgreSQL (Sequelize)，自動建表
 * - 啟動 Express，載入區塊鏈服務
 * - 掛載所有路由 (authRouter, /api/*, /admin/*, 健康檢查等)
 * - 自動呼叫 createDefaultAdmin 建管理員帳號
 * - 最後開始監聽
 ********************************************************************/
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // Sequelize index
const { createDefaultAdmin } = require('./createDefaultAdmin');

// 初始化區塊鏈服務 (確保能連線 Ganache/私有鏈)
const blockchainService = require('./services/blockchainService');
// blockchainService 內部會讀取 .env 的 BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS 等
// 啟動時會自動建立 Web3 與合約實例

// === Controllers & Routers ===
const authController = require('./controllers/authController');
const authRouter = require('./routes/auth');   // /auth prefix => /auth/register, /auth/login
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const trademarkRoutes = require('./routes/trademarkRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// 若您有管理員路由 => /admin/*
const adminUsersRouter = require('./routes/adminUsers'); 
// 以上路由檔案請自行確保存在

// 建立 Express App
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
  res.send(
    `Express server healthy - DB: ${process.env.POSTGRES_DB}, ` +
    `Chain: ${process.env.BLOCKCHAIN_RPC_URL}`
  );
});

// 1) /auth prefix => /auth/register & /auth/login
app.use('/auth', authRouter);

// 2) 其餘 /api/... 路徑
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/trademarks', trademarkRoutes);
app.use('/api/payment', paymentRoutes);
// e.g. app.use('/api/infringement', infringementRoutes);

// 3) 管理員後台路由 => /admin/... 
app.use('/admin', adminUsersRouter);

// 也可直接在 server.js 綁定
app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);

// 與資料庫同步 (若不想自動建表可改 { alter: false })
sequelize.sync({ alter: false })
  .then(async () => {
    console.log('All tables synced!');

    // 建立預設管理員
    if (createDefaultAdmin) {
      await createDefaultAdmin();
      console.log('[server.js] Default admin check done.');
    }

    // 啟動 Express
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to sync tables:', err);
  });
