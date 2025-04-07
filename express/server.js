require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const Web3 = require('web3');
const cloudinary = require('cloudinary').v2;
const FormData = require('form-data');

const pool = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

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

// 健康檢查 API
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 用戶註冊
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username/password missing' });
  try {
    const check = await pool.query('SELECT id FROM users WHERE username=$1', [username]);
    if (check.rowCount > 0) return res.status(400).json({ error: 'User exists' });
    const hash = bcrypt.hashSync(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
    res.json({ message: '註冊成功' });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'DB error' });
  }
});

// 用戶登入
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username/password missing' });
  try {
    const result = await pool.query('SELECT id, username, password FROM users WHERE username=$1', [username]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'User not found' });
    const user = result.rows[0];
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: user.username });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'DB error' });
  }
});

// 其他 API (檔案上傳、查詢等) 可依需求實作

app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}`);
});