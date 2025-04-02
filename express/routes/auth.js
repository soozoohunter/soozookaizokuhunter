const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/User');

// 註冊
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    res.json({ message: '註冊成功', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 登入（發放 access token 與 refresh token）
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: '使用者不存在' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: '密碼錯誤' });
    const accessToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );
    // refresh token 應另存於資料庫，這裡僅示範生成
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    res.json({ message: '登入成功', accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh token 範例（根據實際需求擴充）
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: '缺少 refreshToken' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'refreshToken 無效' });
  }
});

module.exports = router;
