// express/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// 注意：連線資訊可改放在 process.env
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT
});

// 註冊
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    // 簡單示範
    if(!username || !password) return res.status(400).json({ error: '缺少必填欄位' });

    const hashed = await bcrypt.hash(password, 10);
    const insertQuery = 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id';
    const result = await pool.query(insertQuery, [username, hashed]);
    const userId = result.rows[0].id;
    res.json({ message: '註冊成功', userId });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 登入
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({ error: '缺少必填欄位' });

    const userQuery = 'SELECT id, password_hash FROM users WHERE username=$1';
    const result = await pool.query(userQuery, [username]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: '用戶不存在' });
    }

    const { id, password_hash } = result.rows[0];
    const match = await bcrypt.compare(password, password_hash);
    if (!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    // 產生 JWT
    const token = jwt.sign({ userId: id, username }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
