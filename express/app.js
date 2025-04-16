require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

const {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  JWT_SECRET,
  ETH_RPC_URL,
  BLOCKCHAIN_PRIVATE_KEY,
  CONTRACT_ADDRESS
} = process.env;

// PostgreSQL
const db = new Client({
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB
});
db.connect().then(() => {
  console.log('Express: connected to PostgreSQL');
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`;
  return db.query(sql);
}).then(() => {
  console.log("'users' table ensured");
}).catch(err => {
  console.error("DB init error:", err);
});

// Ethereum
let provider = null;
let wallet = null;
let contract = null;
if (ETH_RPC_URL && BLOCKCHAIN_PRIVATE_KEY && CONTRACT_ADDRESS) {
  try {
    provider = new ethers.providers.JsonRpcProvider(ETH_RPC_URL);
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
    console.log("Express: Ethereum contract interface ready");
  } catch(e) {
    console.error("Express: ETH init error:", e);
  }
}

async function registerUserOnChain(username) {
  if (!contract) return null;
  try {
    let tx = await contract.registerUser(username);
    let receipt = await tx.wait();
    return receipt.transactionHash;
  } catch(e) {
    console.error("registerUserOnChain error:", e);
    return null;
  }
}

// 健康檢查
app.get('/health', (req,res)=>{
  res.json({ status: 'express-ok' });
});

// 註冊
app.post('/api/auth/register', async(req,res)=>{
  try {
    const { username, password } = req.body;
    if(!username || !password) {
      return res.status(400).json({ message:'Need username & password' });
    }
    // check exists
    const check = await db.query("SELECT id FROM users WHERE username=$1", [username]);
    if(check.rows.length>0) {
      return res.status(409).json({ message:'Username already used' });
    }
    const hash = await bcrypt.hash(password, 10);
    const ins = await db.query(
      "INSERT INTO users(username, password_hash) VALUES($1, $2) RETURNING id",
      [username, hash]
    );
    const userId = ins.rows[0].id;
    let chainTx = null;
    if(contract) {
      chainTx = await registerUserOnChain(username);
    }
    return res.json({ message:'註冊成功', txHash: chainTx });
  } catch(err) {
    console.error("Register error:", err);
    return res.status(500).json({ message:'伺服器錯誤' });
  }
});

// 登入
app.post('/api/auth/login', async(req,res)=>{
  try {
    const { username, password } = req.body;
    if(!username || !password) {
      return res.status(400).json({ message:'Missing username or password' });
    }
    const q = await db.query("SELECT * FROM users WHERE username=$1", [username]);
    if(q.rows.length===0) {
      return res.status(401).json({ message:'Invalid credentials' });
    }
    const user = q.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if(!match) {
      return res.status(401).json({ message:'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId:user.id, username:user.username },
      JWT_SECRET,
      { expiresIn:'24h' }
    );
    return res.json({ message:'登入成功', token });
  } catch(err) {
    console.error("Login error:", err);
    return res.status(500).json({ message:'Server error' });
  }
});

const PORT = 3000;
app.listen(PORT, ()=>{
  console.log(`Express on port ${PORT}`);
});
