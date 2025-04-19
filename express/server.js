/**
 * express/server.js
 * - 讀取 .env（若無則使用 fallback）
 * - 連 PostgreSQL (Sequelize) 並同步資料表
 * - 啟動 Express
 * - 掛載所有路由 (auth, upload, membership)
 * - 提供健康檢查 /api/health
 * - 在 production 模式時，提供 React 靜態檔 (../frontend/build)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./models'); // <-- Sequelize 初始化

//---------------------
// 讀取環境變數 + fallback
//---------------------
const DB_URL = process.env.DATABASE_URL
  || 'postgresql://suzoo:KaiShieldDbPass2023!@suzoo_postgres:5432/suzoo';

const JWT_SECRET = process.env.JWT_SECRET
  || 'ZmVkOWY4ZDItNWU3MC00NDM5LW';

const IPFS_API_URL = process.env.IPFS_API_URL
  || 'http://suzoo_ipfs:5001';

const BLOCKCHAIN_RPC_URL = process.env.BLOCKCHAIN_RPC_URL
  || 'http://suzoo_ganache:8545';

const SSL_CERT_PATH = process.env.SSL_CERT_PATH
  || '/etc/letsencrypt/live/suzookaizokuhunter.com/fullchain.pem';

const SSL_CERT_KEY_PATH = process.env.SSL_CERT_KEY_PATH
  || '/etc/letsencrypt/live/suzookaizokuhunter.com/privkey.pem';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
  || '71dbbf39f7msh794002260b4e71bp1025e2jsn652998e0f81a';

const EMAIL_USER = process.env.EMAIL_USER
  || 'jeffqqm@gmail.com';

// 其他環境變數可依需求列出
// ...

//---------------------
// 建立 Express App
//---------------------
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//---------------------
// 路由
//---------------------
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const membershipRoutes = require('./routes/membership');

//---------------------
// 健康檢查 /api/health
//---------------------
app.get('/api/health', (req, res) => {
  res.send('OK');
});

//---------------------
// 掛載路由
//---------------------
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/membership', membershipRoutes);

//---------------------
// 若在 production 中，提供 React build
//---------------------
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

//---------------------
// 同步 Sequelize + 啟動
//---------------------
db.sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('[server.js] PostgreSQL + Sequelize synced!');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express listening on port ${PORT}`);
      console.log('Using DB_URL =', DB_URL);
      console.log('Using JWT_SECRET =', JWT_SECRET);
      console.log('Using IPFS_API_URL =', IPFS_API_URL);
      console.log('Using BLOCKCHAIN_RPC_URL =', BLOCKCHAIN_RPC_URL);
      console.log('Using SSL_CERT_PATH =', SSL_CERT_PATH);
      console.log('Using SSL_CERT_KEY_PATH =', SSL_CERT_KEY_PATH);
      console.log('Using RAPIDAPI_KEY =', RAPIDAPI_KEY);
      console.log('Using EMAIL_USER =', EMAIL_USER);
      // ...可視需求再 console 更多
    });
  })
  .catch((err) => {
    console.error('[server.js] sync error:', err);
  });
