require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// Joi: 註冊
const registerSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  userName: Joi.string().min(3).max(30).trim().required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
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

// Joi: 登入 => email or userName
const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase(),
  userName: Joi.string().trim(),
  password: Joi.string().required()
}).or('email','userName');

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly:false });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let {
      email, userName, password, confirmPassword,
      IG, FB, YouTube, TikTok, Shopee,
      Ruten, Yahoo, Amazon, eBay, Taobao
    } = value;

    email = email.trim().toLowerCase();

    // 檢查重複
    const existEmail = await User.findOne({ where:{ email } });
    if (existEmail) return res.status(400).json({ message:'此 Email 已被註冊' });
    const existUser = await User.findOne({ where:{ userName } });
    if (existUser) return res.status(400).json({ message:'使用者名稱已被使用' });

    // bcrypt 雜湊
    const hashedPwd = await bcrypt.hash(password, 10);

    // 建立使用者
    await User.create({
      email,
      userName,
      password: hashedPwd,
      plan:'BASIC',
      socialBinding: JSON.stringify({
        IG, FB, YouTube, TikTok, Shopee,
        Ruten, Yahoo, Amazon, eBay, Taobao
      })
    });

    return res.status(201).json({ message:'註冊成功' });
  } catch(err) {
    console.error('[Register Error]', err);
    if (err.name==='SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path;
      if (field==='email') return res.status(400).json({ message:'此 Email 已被註冊' });
      if (field==='userName') return res.status(400).json({ message:'使用者名稱已被使用' });
      return res.status(400).json({ message:'資料重複無法使用' });
    }
    return res.status(500).json({ message:'註冊失敗' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly:false });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { email, userName, password } = value;
    let user;
    if (email) {
      user = await User.findOne({ where:{ email } });
    } else {
      user = await User.findOne({ where:{ userName } });
    }
    if (!user) {
      return res.status(400).json({ message:'帳號或密碼錯誤' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message:'帳號或密碼錯誤' });
    }

    // JWT
    const token = jwt.sign({
      userId: user.id,
      userName: user.userName,
      email: user.email,
      role: user.role
    }, JWT_SECRET, { expiresIn:'24h' });

    return res.json({ message:'登入成功', token });
  } catch(err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message:'登入失敗' });
  }
});

module.exports = router;
