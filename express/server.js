require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { create } = require('ipfs-http-client');
const axios = require('axios');

const {
  POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB,
  JWT_SECRET, IPFS_HOST, IPFS_PORT
} = process.env;

const app = express();
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// ============= DB連線 =============
const pool = new Pool({
  user: POSTGRES_USER,
  host: 'db',
  database: POSTGRES_DB,
  password: POSTGRES_PASSWORD,
  port: 5432
});

// ============= IPFS連線 =============
const ipfs = create({
  host: IPFS_HOST || 'ipfs',
  port: IPFS_PORT || 5001,
  protocol: 'http'
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'Express is healthy' });
});

// 用戶註冊
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hashed]);
  res.json({ message: 'Register success' });
});

// 用戶登入
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (result.rowCount === 0) return res.status(401).json({ error: 'User not found' });
  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Wrong password' });
  const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// 上傳檔案 + IPFS
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileBuffer = fs.readFileSync(req.file.path);
    // 上傳到 IPFS
    const ipfsResult = await ipfs.add(fileBuffer);
    const cid = ipfsResult.cid.toString();
    console.log("IPFS CID:", cid);

    // 計算指紋(雜湊)
    const crypto = require('crypto');
    const fingerprint = '0x' + crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 存到DB
    await pool.query(
      'INSERT INTO fingerprints (hash, ipfs_cid) VALUES ($1, $2) RETURNING id',
      [fingerprint, cid]
    );

    res.json({ message: 'Upload success', fingerprint, ipfs_cid: cid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.toString() });
  } finally {
    fs.unlinkSync(req.file.path); // 刪除上傳暫存檔
  }
});

app.listen(3000, () => console.log('Express server on port 3000'));
