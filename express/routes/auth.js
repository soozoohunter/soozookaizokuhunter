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

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false, 
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// 註冊
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺 email/password' });
    }

    let exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ error: 'Email已存在' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser = await User.create({
      email,
      password_hash: passwordHash,
      role: role || 'shortVideo'
    });

    // 寄送歡迎信
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: '歡迎加入 速誅侵權獵人 X',
        text: '感謝您註冊，開始保護版權吧！'
      });
    } catch (mailErr) {
      console.error('寄信失敗:', mailErr);
    }

    res.json({ message: '註冊成功', userId: newUser.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 登入
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: '用戶不存在' });
    }

    let match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    let token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: '登入成功', token, role: user.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
