const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      email, username, password, confirmPassword,
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, Taobao, eBay
    } = req.body;

    // 1) 檢查必填
    if (!email || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: '必填欄位未填 (Missing required fields)' });
    }
    // 2) 密碼一致
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '兩次輸入的密碼不一致 (Passwords do not match)' });
    }
    // 3) 至少一個社群/電商
    const accounts = [IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay];
    const hasAccount = accounts.some(acc => acc && acc.trim() !== '');
    if (!hasAccount) {
      return res.status(400).json({ message: '請至少填寫一個社群或電商帳號 (At least one platform account)' });
    }

    // 檢查 Email / username 是否重複
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({ message: '此 Email 已被使用 (Email already in use)' });
    }
    const existUser = await User.findOne({ where: { username } });
    if (existUser) {
      return res.status(400).json({ message: '此用戶名已被使用 (Username already in use)' });
    }

    // 產生 serialNumber (可自定義)
    const dateStr = new Date().toISOString().replace(/[-:.T]/g, '').slice(0, 8);
    const serialNumber = `${dateStr}-${uuidv4().split('-')[0]}`;

    // bcrypt 雜湊
    const hashedPwd = await bcrypt.hash(password, 10);

    // 建立 User
    await User.create({
      serialNumber,
      email,
      username,
      password: hashedPwd,
      IG: IG || null,
      FB: FB || null,
      YouTube: YouTube || null,
      TikTok: TikTok || null,
      Shopee: Shopee || null,
      Ruten: Ruten || null,
      Yahoo: Yahoo || null,
      Amazon: Amazon || null,
      Taobao: Taobao || null,
      eBay: eBay || null
    });

    return res.status(201).json({ message: '註冊成功 (Registration success)' });
  } catch (err) {
    console.error('[Register Error]', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path;
      let msg = '資料重複 (Duplicate field)';
      if (field === 'email') msg = 'Email 已被使用';
      if (field === 'username') msg = '用戶名已被使用';
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: '註冊失敗 (Registration failed)' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    // 前端若用 identifier => if includes('@') => email, else => userName
    // 這裡依前端傳輸型態可調整
    const { email, userName, password } = req.body;

    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (userName) {
      user = await User.findOne({ where: { username: userName } });
    } else {
      return res.status(400).json({ message: '請輸入 email 或 userName (Missing email or userName)' });
    }

    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤 (Invalid credentials)' });
    }

    // 檢查密碼
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤 (Wrong password)' });
    }

    // 簽發 JWT
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      username: user.username,
      serialNumber: user.serialNumber
    }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({ message: '登入成功 (Login success)', token });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: '登入失敗 (Login failed)' });
  }
});

module.exports = router;
