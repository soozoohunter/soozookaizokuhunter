/**
 * express/routes/auth.js
 *
 * - POST /auth/register => 註冊 (支援 email + userName + bcrypt 雜湊)
 * - POST /auth/login    => 同時支援 email or userName + password
 * - (可選) POST /auth/loginByUserName => 若歷史需求保留
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/* ---------- 1) Joi 驗證規則 ---------- */

// 註冊表單
const registerSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  userName: Joi.string().min(3).max(30).trim().required(),
  password: Joi.string().min(4).required(), // 可自行改成 min(8) 等
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  role: Joi.string().valid('admin','user','copyright','trademark','both')
           .optional(),
  IG: Joi.string().allow(''),
  FB: Joi.string().allow(''),
  YouTube: Joi.string().allow(''),
  TikTok: Joi.string().allow(''),
  Shopee: Joi.string().allow(''),
  Ruten: Joi.string().allow(''),
  Yahoo: Joi.string().allow(''),
  Amazon: Joi.string().allow(''),
  eBay: Joi.string().allow(''),
  Taobao: Joi.string().allow('')
});

// 登入表單 => 同時支援 email 或 userName
// 使用 or('email','userName') 而非 xor，允許至少提供其中之一
const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase(),
  userName: Joi.string().trim(),
  password: Joi.string().required()
}).or('email','userName');

/* ---------- 2) POST /register ---------- */
router.post('/register', async (req, res) => {
  try {
    // Joi 驗證
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      // 回傳第一個或全部錯誤均可
      const firstMsg = error.details[0].message;
      return res.status(400).json({ message: firstMsg });
    }

    let {
      email,
      userName,
      password,
      confirmPassword,
      role,
      IG, FB, YouTube, TikTok, Shopee,
      Ruten, Yahoo, Amazon, eBay, Taobao
    } = value;

    // 檢查重複 (email, userName)
    email = email.trim().toLowerCase();
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const existUser = await User.findOne({ where: { userName } });
    if (existUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // bcrypt 雜湊
    const hashedPwd = await bcrypt.hash(password, 10);

    // role 不存在 => 預設 'user'
    if (!role || !['admin','user','copyright','trademark','both'].includes(role)) {
      role = 'user';
    }

    // 建立使用者
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role,
      plan: 'free', // 可自行調整
      socialBinding: JSON.stringify({
        IG, FB, YouTube, TikTok, Shopee,
        Ruten, Yahoo, Amazon, eBay, Taobao
      })
    });

    return res.status(201).json({
      message: 'Registration successful',
      role: newUser.role
    });
  } catch (err) {
    console.error('[Register Error]', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path;
      let msg = '資料重複無法使用';
      if (field === 'email') {
        msg = '此 Email 已被註冊';
      } else if (field === 'userName') {
        msg = '使用者名稱已被使用';
      }
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: 'Registration failed' });
  }
});

/* ---------- 3) POST /login ---------- */
router.post('/login', async (req, res) => {
  try {
    // Joi 驗證
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const firstMsg = error.details[0].message;
      return res.status(400).json({ message: firstMsg });
    }

    const { email, userName, password } = value;
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (userName) {
      user = await User.findOne({ where: { userName } });
    }
    if (!user) {
      return res.status(400).json({ message: 'Invalid account or password' });
    }

    // bcrypt compare
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid account or password' });
    }

    // 簽發 JWT
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      userName: user.userName,
      role: user.role
    }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

/* ---------- 4) (可選) POST /loginByUserName ---------- */
router.post('/loginByUserName', async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ message: 'userName and password are required' });
    }
    const user = await User.findOne({ where: { userName } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid account or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid account or password' });
    }

    const token = jwt.sign({
      userId: user.id,
      userName: user.userName,
      role: user.role
    }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('[loginByUserName Error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
