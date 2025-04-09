// express/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * 註冊
 * - 檢查是否已存在
 * - bcrypt 雜湊
 * - DB create
 */
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 檢查是否已被註冊
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ error: '此 Email 已被註冊' });
    }

    // 建立
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });
    res.json({ message: '註冊成功', user });
  } catch (err) {
    // 若出現 "string did not match pattern" => 是 Sequelize Validation Error
    res.status(500).json({ error: err.message });
  }
});

/**
 * 登入
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }
    // bcrypt 比對
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '密碼錯誤' });
    }
    const token = generateToken({ id: user.id, email: user.email });
    res.json({ message: '登入成功', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
