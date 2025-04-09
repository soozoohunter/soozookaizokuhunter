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

/**
 * [POST] /api/auth/register
 * 用戶註冊：
 * 1) 檢查重複 Email 
 * 2) 雜湊密碼 (bcrypt)
 * 3) 建立 User
 * 4) 回傳成功 / 錯誤
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    // 1) 檢查重複 Email
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ error: '您已經註冊過了，請至登入頁面' });
    }

    // 2) 雜湊密碼
    const hashed = await bcrypt.hash(password, 10);

    // 3) 建立新用戶
    const newUser = await User.create({
      email,
      password: hashed,
      // 若你需要其他欄位，如 username, user_type, 都可自行補上
    });

    // 4) 回傳成功
    res.json({ 
      message: '註冊成功', 
      userId: newUser.id, 
      email: newUser.email 
    });

    // ※ 如需將 "註冊 email" 上鏈，也可在此呼叫區塊鏈程式
    //   e.g. writeToBlockchain(newUser.email);
    
  } catch (err) {
    console.error('[Register Error]', err);
    // 若是 unique constraint triggered, err 可能是 SequelizeUniqueConstraintError
    // 你可再細分錯誤：err.name === 'SequelizeUniqueConstraintError' ...
    return res.status(500).json({ error: err.message || '系統錯誤' });
  }
});

/**
 * [POST] /api/auth/login
 * 用戶登入：
 * 1) 依 email 找用戶
 * 2) bcrypt.compare 驗證密碼
 * 3) 產生 JWT Token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    // 驗證密碼
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    // 產生 JWT
    const token = generateToken({
      id: user.id,
      email: user.email
    });
    // 也可加 userType: user.user_type etc.

    res.json({
      message: '登入成功',
      token
    });
    
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
