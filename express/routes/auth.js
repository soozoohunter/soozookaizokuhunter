/********************************************************************
 * express/routes/auth.js
 * 最終整合：一次性註冊 + 登入 (含區塊鏈紀錄、JWT、bcrpytjs)
 ********************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // 使用 bcryptjs
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Sequelize Model
const chain = require('../utils/chain'); // 區塊鏈 (可選)

// 建議從 .env 中讀取，若無則用預設
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/**
 * [POST] /auth/register
 * 需求： email, userName, password, confirmPassword, role
 * 預設 plan = 'BASIC'
 * 註冊成功後將資料上鏈 (可選)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, userName, password, confirmPassword, role } = req.body;

    // 1) 檢查必填欄位
    if (!email || !userName || !password || !confirmPassword) {
      return res.status(400).json({ message: '缺少必填欄位(email, userName, password, confirmPassword)' });
    }

    // 2) 密碼/確認密碼一致檢查
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '兩次密碼不一致' });
    }

    // 3) 檢查 email 是否重複
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ message: '此 Email 已被註冊' });
    }

    // 4) 預設 plan = 'BASIC'
    const plan = 'BASIC';

    // 5) bcrypt 雜湊 password
    const hashedPwd = await bcrypt.hash(password, 10);

    // 6) 建立新使用者
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role: role || 'copyright',
      plan
    });

    // 7) 上鏈 (可選)
    try {
      // 這是範例: chain.writeCustomRecord(type, data)
      const recordData = `REGISTER|email=${email}|userName=${userName}|role=${role||'copyright'}`;
      await chain.writeCustomRecord('REGISTER', recordData);
    } catch (e) {
      console.error('[Register => blockchain error]', e);
      // 上鏈失敗不影響註冊流程
    }

    return res.status(201).json({
      message: '註冊成功',
      plan,
      role: newUser.role
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ message: '註冊失敗，請稍後再試' });
  }
});

/**
 * [POST] /auth/login
 * 登入： 目前保留 email + password (原先設計)
 * 若要改成 userName + password，請參考下方 "loginByUserName" 範例
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '缺少 email 或 password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: '登入失敗，請稍後再試' });
  }
});

/**
 * [POST] /auth/loginByUserName
 * 另提供：以 userName + password 登入 (如有需要)
 */
router.post('/loginByUserName', async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ error: '請提供使用者名稱及密碼。' });
    }

    const user = await User.findOne({ where: { userName } });
    if (!user) {
      return res.status(401).json({ error: '帳號或密碼錯誤。' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '帳號或密碼錯誤。' });
    }

    // 簽發 JWT
    const token = jwt.sign(
      { userId: user.id, userName: user.userName, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: '登入成功！',
      token
    });
  } catch (err) {
    console.error('[loginByUserName Error]', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
});

module.exports = router;
