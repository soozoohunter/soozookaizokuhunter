/**
 * express/server.js (整合後單一版本)
 *
 * - 讀取 .env（若無則使用 fallback）
 * - 連 PostgreSQL (Sequelize) 並同步資料表
 * - （可選）同時初始化 pg 原生 Client + Ethereum Blockchain
 * - 啟動 Express
 * - 掛載所有路由 (auth, upload, membership, admin)
 * - 提供健康檢查 /api/health
 * - 在 production 模式時，提供 React 靜態檔 (../frontend/build)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

// 1) Sequelize 初始化
const db = require('./models'); // <-- 包含 Sequelize 實例
const { sequelize } = db;       // 也可 db.sequelize

// 2) 可選：pg 原生 Client (若您確實要用到 app.js 原生查詢)
const { Client } = require('pg');

// 3) 可選：ethers, blockchain
const { ethers } = require('ethers');

//---------------------
// 讀取環境變數 + fallback
//---------------------
const {
  DATABASE_URL,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  NODE_ENV,
  JWT_SECRET,
  IPFS_API_URL,
  BLOCKCHAIN_RPC_URL,
  BLOCKCHAIN_PRIVATE_KEY,
  CONTRACT_ADDRESS,
  SSL_CERT_PATH,
  SSL_CERT_KEY_PATH,
  RAPIDAPI_KEY,
  EMAIL_USER
} = process.env;

// 預設 fallback
const DB_URL = DATABASE_URL
  || 'postgresql://suzoo:KaiShieldDbPass2023!@suzoo_postgres:5432/suzoo';

//---------------------
// 可選：初始化 pg 原生 client (來自原 app.js)
//---------------------
let rawClient = null;
if (POSTGRES_HOST && POSTGRES_USER && POSTGRES_DB) {
  rawClient = new Client({
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB
  });
  rawClient.connect()
    .then(() => {
      console.log('Raw pg client: connected to PostgreSQL');
      // 如果您確實想用 raw query 建表，可在這邊執行
      const sql = `
        CREATE TABLE IF NOT EXISTS users_raw (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );`;
      return rawClient.query(sql);
    })
    .then(() => {
      console.log("'users_raw' table ensured (for raw pg demo)");
    })
    .catch(err => {
      console.error("Raw pg client init error:", err);
    });
} else {
  console.log('Raw pg client is disabled (missing POSTGRES_ env?).');
}

//---------------------
// 可選：Ethereum 區塊鏈初始化
//---------------------
let provider = null;
let wallet = null;
let contract = null;
function initBlockchain() {
  if (BLOCKCHAIN_RPC_URL && BLOCKCHAIN_PRIVATE_KEY && CONTRACT_ADDRESS) {
    try {
      provider = new ethers.providers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
      wallet = new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, provider);
      const abi = [
        {
          "inputs":[{"name":"username","type":"string"}],
          "name":"registerUser",
          "outputs":[],
          "stateMutability":"nonpayable",
          "type":"function"
        }
      ];
      contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
      console.log("Blockchain contract interface ready");
    } catch(e) {
      console.error("ETH init error:", e);
    }
  } else {
    console.log("Blockchain config not complete, skip init.");
  }
}

// (示範) 區塊鏈上鏈函式
async function registerUserOnChain(username) {
  if (!contract) return null;
  try {
    const tx = await contract.registerUser(username);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (e) {
    console.error("registerUserOnChain error:", e);
    return null;
  }
}

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
const adminRoutes = require('./routes/admin'); // ★ 新增：管理員路由

//---------------------
// 健康檢查 /api/health
//---------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mode: NODE_ENV || 'development' });
});

//---------------------
// 掛載一般路由
//---------------------
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/membership', membershipRoutes);

//---------------------
// 管理員後台路由 (不帶 /api)，對應前端 fetch('/admin/...')
//---------------------
app.use('/admin', adminRoutes);

//---------------------
// 若在 production 中，提供 React build
//---------------------
if (NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(staticPath));
  // 任何未知路徑都回傳前端 index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

//---------------------
// 同步 Sequelize + 啟動
//---------------------
sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('[server.js] PostgreSQL + Sequelize synced!');
    // 初始化區塊鏈
    initBlockchain();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express server listening on port ${PORT}`);
      console.log('Using DB_URL =', DB_URL);
      console.log('Using JWT_SECRET =', JWT_SECRET || 'No JWT Secret?');
      console.log('Using IPFS_API_URL =', IPFS_API_URL);
      console.log('Using BLOCKCHAIN_RPC_URL =', BLOCKCHAIN_RPC_URL);
      console.log('Using SSL_CERT_PATH =', SSL_CERT_PATH);
      console.log('Using SSL_CERT_KEY_PATH =', SSL_CERT_KEY_PATH);
      console.log('Using RAPIDAPI_KEY =', RAPIDAPI_KEY);
      console.log('Using EMAIL_USER =', EMAIL_USER);
      console.log('MODE =', NODE_ENV);
    });
  })
  .catch((err) => {
    console.error('[server.js] sync error:', err);
  });
