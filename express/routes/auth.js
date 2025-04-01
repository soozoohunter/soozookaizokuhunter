// express/routes/auth.js

require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const {
  JWT_SECRET,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM
} = process.env;

/**
 * Nodemailer 初始化
 */
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

/**
 * [POST] /api/auth/signup
 * 用戶註冊
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    // 檢查是否已註冊
    let exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ error: 'Email已被註冊' });
    }

    // 密碼雜湊
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 建立 User
    let newUser = await User.create({
      email,
      password_hash: passwordHash,  // 注意：這裡對應 user model 的欄位「password_hash」
      role: role || 'shortVideo'
    });

    // 寄送歡迎信（可選）
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: '歡迎加入速誅侵權獵人',
        text: '感謝您註冊，立即開始「獵殺」侵權吧！'
      });
    } catch (mailErr) {
      console.error('寄送歡迎信失敗:', mailErr.message);
    }

    res.json({ message: '註冊成功', userId: newUser.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * [POST] /api/auth/login
 * 用戶登入
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    // 查找用戶
    let user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: '用戶不存在' });
    }

    // 比對密碼
    let match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    // 產生 JWT
    let token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET || 'KaiKaiShieldSecret',
      { expiresIn: '2h' }
    );

    res.json({ message: '登入成功', token, role: user.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
