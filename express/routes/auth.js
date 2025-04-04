const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/User');

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// 註冊
router.post('/register', async (req, res) => {
  const { username, email, password, userType } = req.body; // userType: 'short-video' or 'seller'
  try {
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
    if (!user) return res.status(404).json({ error: '使用者不存在' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: '密碼錯誤' });
    const token = generateToken({ id: user.id, email: user.email, userType: user.user_type });
    res.json({ message: '登入成功', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
