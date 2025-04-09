// express/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 假設您有這個檔案:
const { writeToBlockchain } = require('../utils/chain');
// 或若是直接從 blockchain.js export，也可用: 
// const { writeToBlockchain } = require('../routes/blockchain');

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

    // 1) 檢查重複 Email
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ error: '您已經註冊過了，請至登入頁面' });
    }

    // 2) 雜湊密碼
    const hashed = await bcrypt.hash(password, 10);

    // 3) 建立新用戶
    const newUser = await User.create({ email, password: hashed });

    // 4) 同步寫入區塊鏈 (例如: 只上傳 email)
    try {
      await writeToBlockchain(email);
      // 寫入成功後續不一定要回傳，但可印log
      console.log('已將使用者 email 寫入區塊鏈:', email);
    } catch (chainErr) {
      console.error('上鏈失敗:', chainErr);
      // 如果上鏈失敗，您可選擇繼續回傳註冊成功, 或是 rollback
      // 這裡先單純記錄錯誤
    }

    // 5) 回傳成功
    res.json({ message: '註冊成功', userId: newUser.id, email: newUser.email });
  } catch (err) {
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

    res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
