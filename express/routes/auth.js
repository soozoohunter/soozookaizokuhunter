// express/routes/auth.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // 使用 bcryptjs 並統一命名為 bcrypt
require('dotenv').config();

const User = require('../models/User');

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// 註冊
router.post('/register', async (req, res) => {
  const { username, email, password, userType } = req.body; // userType 預期為 'short-video' 或 'seller'
  try {
    // 使用 bcrypt 進行雜湊
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashed,
      user_type: userType
    });
    res.json({ message: '註冊成功', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 登入
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }
    // 使用 bcrypt.compare 進行密碼比對
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '密碼錯誤' });
    }
    const token = generateToken({ id: user.id, email: user.email, userType: user.user_type });
    res.json({ message: '登入成功', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;