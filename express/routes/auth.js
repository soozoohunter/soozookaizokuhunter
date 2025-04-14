/********************************************************************
 * express/routes/auth.js (最終版：一次性註冊 + 登入)
 ********************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');  // 注意改用 bcryptjs
const jwt = require('jsonwebtoken');

// Sequelize
const { User } = require('../models');

// 區塊鏈 (上鏈)
const chain = require('../utils/chain');

// JWT SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/**
 * [POST] /auth/register
 * 一次性註冊: email, userName, password, confirmPassword, role
 * 預設 plan = 'BASIC'
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      userName,
      password,
      confirmPassword,
      role
    } = req.body;

    // 1) 必填檢查
    if (!email || !userName || !password || !confirmPassword) {
      return res.status(400).json({ message: '缺少必填欄位 (email, userName, password, confirmPassword)' });
    }
    // 2) 密碼比對
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '兩次密碼輸入不相符' });
    }
    // 3) email 是否重複
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ message: '此 Email 已註冊過' });
    }

    // 4) 預設 plan = 'BASIC'
    let plan = 'BASIC';

    // 5) 建立 user (bcryptjs)
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashed,
      userName,
      role: role || 'copyright',  // 若沒填 role, 預設 'copyright'
      plan
    });

    // 6) 上鏈
    try {
      // 紀錄: userName, email, role
      const dataOnChain = `REGISTER|email=${email}|userName=${userName}|role=${role||'copyright'}`;
      await chain.writeCustomRecord('REGISTER', dataOnChain);
    } catch (chainErr) {
      console.error('[Register] 上鏈失敗:', chainErr);
      // 不影響註冊流程
    }

    return res.json({ message: '註冊成功', plan, role: newUser.role });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ message: '註冊失敗，請稍後再試' });
  }
});

/**
 * [POST] /auth/login
 * email + password => JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '缺少 email 或 password' });
    }
    // 找 user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }
    // bcryptjs 驗證
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 簽發 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: '登入失敗，請稍後再試' });
  }
});

module.exports = router;
