const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// 來自 chain.js，用於把 email 上鏈
const { writeToBlockchain } = require('../utils/chain');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// 產生 JWT Token
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * [POST] /api/auth/register
 *   - 檢查重複 Email
 *   - bcrypt 雜湊
 *   - 建立新用戶
 *   - (可選) 上鏈
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    // 檢查重複 Email
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ error: '您已經註冊過了，請至登入頁面' });
    }

    // 雜湊密碼
    const hashed = await bcrypt.hash(password, 10);

    // 建立新用戶
    const newUser = await User.create({ 
      email, 
      password: hashed
    });

    // (可選) 上鏈：只上傳 email 或您想記錄的資訊
    try {
      const txHash = await writeToBlockchain(email);
      console.log('[Register] 已將使用者 Email 上鏈:', email, 'TxHash=', txHash);
    } catch (chainErr) {
      console.error('[Register] 上鏈失敗:', chainErr);
      // 如要 rollback DB, 可在這裡處理; 也可只是記錄失敗, 讓註冊繼續成功
    }

    return res.json({
      message: '註冊成功',
      userId: newUser.id,
      email: newUser.email
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ error: err.message || '系統錯誤' });
  }
});

/**
 * [POST] /api/auth/login
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
    const token = generateToken({ id: user.id, email: user.email });
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
