// express/server.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const axios = require('axios');
const Web3 = require('web3');
const cloudinary = require('cloudinary').v2;
const FormData = require('form-data');

// 建立 Express 應用程式
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 預設埠 (若 .env 未設置 PORT=xxx)
const PORT = process.env.PORT || 3000;

// 連線 PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB  // e.g. "suzoo_db"
});

// 如您有獨立的 express/db.js 也可改用：
// const pool = require('./db'); // 同樣匯入設定

// Cloudinary 設定
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// 連線 Ganache (區塊鏈)
const web3 = new Web3(`http://${process.env.GANACHE_HOST || 'ganache'}:${process.env.GANACHE_PORT || 8545}`);

// JWT 驗證中介函式
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Multer: 上傳檔案於記憶體
const upload = multer({ storage: multer.memoryStorage() });

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 註冊
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username/password missing' });
  try {
    const check = await pool.query('SELECT id FROM users WHERE username=$1', [username]);
    if (check.rowCount > 0) {
      return res.status(400).json({ error: 'User exists' });
    }
    const hash = bcrypt.hashSync(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
    res.json({ message: '註冊成功' });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'DB error' });
  }
});

// 登入
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username/password missing' });
  try {
    const result = await pool.query('SELECT id, username, password FROM users WHERE username=$1', [username]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'User not found' });
    const user = result.rows[0];
    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: user.username });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'DB error' });
  }
});

// 上傳檔案
app.post('/api/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileBuffer = req.file.buffer;
  const originalName = req.file.originalname || 'uploadfile';

  try {
    // 1) Cloudinary
    const cloudResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }).end(fileBuffer);
    });
    const cloudUrl = cloudResult.secure_url;

    // 2) IPFS
    let ipfsHash = null;
    try {
      const form = new FormData();
      form.append('file', fileBuffer, { filename: originalName });
      const ipfsRes = await axios.post(`${process.env.IPFS_API_URL}/api/v0/add?pin=true`, form, {
        headers: form.getHeaders()
      });
      if (typeof ipfsRes.data === 'string') {
        const lines = ipfsRes.data.trim().split('\n');
        const firstLine = JSON.parse(lines[0]);
        ipfsHash = firstLine.Hash;
      } else {
        ipfsHash = ipfsRes.data.Hash;
      }
    } catch (e) {
      console.error('IPFS upload fail:', e.message);
    }

    // 3) 指紋 => 呼叫 FastAPI
    let fingerprint = null;
    try {
      const resp = await axios.post('http://fastapi:8000/fingerprint', { url: cloudUrl });
      fingerprint = resp.data.fingerprint;
    } catch (e) {
      console.error('Call FastAPI fingerprint fail:', e.message);
      // fallback => 自己算MD5
      fingerprint = crypto.createHash('md5').update(fileBuffer).digest('hex');
    }

    // 4) 區塊鏈 => Ganache
    let txHash = null;
    try {
      const accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        const dataHex = web3.utils.asciiToHex(fingerprint);
        const receipt = await web3.eth.sendTransaction({
          from: accounts[0],
          to: accounts[0],
          data: dataHex,
          value: 0
        });
        txHash = receipt.transactionHash;
      }
    } catch (e) {
      console.error('Chain TX fail:', e);
    }

    // 5) 寫入 DB => files 表
    const userId = req.user.id;
    const insert = await pool.query(
      `INSERT INTO files (user_id, filename, fingerprint, ipfs_hash, cloud_url, tx_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, filename, fingerprint, ipfs_hash, cloud_url, dmca_flag, uploaded_at, tx_hash`,
      [userId, originalName, fingerprint, ipfsHash, cloudUrl, txHash]
    );
    const newFile = insert.rows[0];

    res.json(newFile);
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ error: 'File upload error' });
  }
});

// 列出檔案
app.get('/api/files', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT id, filename, fingerprint, ipfs_hash, cloud_url, dmca_flag, tx_hash, uploaded_at
       FROM files
       WHERE user_id=$1
       ORDER BY uploaded_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Get files error:', e);
    res.status(500).json({ error: 'DB error' });
  }
});

// 啟動
app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}`);
});
