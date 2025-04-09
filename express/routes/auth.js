// express/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// 產生 JWT Token
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// [POST] /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    // 1) 建立新用戶 (Sequelize unique: true => 檢測重複)
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashed });

    // 2) 回傳成功
    return res.json({
      message: '註冊成功',
      userId: newUser.id,
      email: newUser.email
    });

  } catch (err) {
    // 若是重複 email
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(400)
        .json({ error: '您已經註冊過了，請到登入系統' });
    }
    console.error('[Register Error]', err);
    return res.status(500).json({ error: err.message || '系統錯誤' });
  }
});

// [POST] /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    // 1) 找 User
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    // 2) bcrypt.compare
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    // 3) 產生 JWT
    const token = generateToken({ id: user.id, email: user.email });
    return res.json({
      message: '登入成功',
      token
    });

  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
