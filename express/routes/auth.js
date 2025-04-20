/********************************************************************
 * express/routes/auth.js
 *
 * - POST /auth/register => 註冊 (同時檢查 email/userName + bcrypt 雜湊)
 * - POST /auth/login    => 同時支援 email or userName + password
 * - (可選) POST /auth/loginByUserName => 若專案歷史需求
 ********************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User } = require('../models'); // './models' 或依您實際位置
// const chain = require('../utils/chain'); // 如果需要區塊鏈紀錄可引入

// JWT 秘鑰
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/* ------------------ 1) Joi 驗證 (註冊 / 登入) ------------------ */

// 註冊表單
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  userName: Joi.string().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  role: Joi.string().valid('admin','user','copyright','trademark','both')
           .optional(), // 若不傳 => 預設 'user'

  // 允許空字串 (鼓勵填寫，但不強制)
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

// 登入表單 => 同時支援 email 或 userName + password
const loginSchema = Joi.object({
  email: Joi.string().email(),
  userName: Joi.string(),
  password: Joi.string().required()
}).xor('email','userName');

/* ------------------ 2) POST /auth/register ------------------ */
router.post('/register', async (req, res) => {
  try {
    // 1) Joi 驗證
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
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

    // email 正規化
    email = email.trim().toLowerCase();

    // 檢查重複 email
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({ message: '此 Email 已被註冊' });
    }

    // 檢查重複 userName
    const existUser = await User.findOne({ where: { userName } });
    if (existUser) {
      return res.status(400).json({ message: '使用者名稱已被使用' });
    }

    // bcrypt 雜湊
    const hashedPwd = await bcrypt.hash(password, 10);

    // role 不傳 => 預設 'user'
    if (!role || !['admin','user','copyright','trademark','both'].includes(role)) {
      role = 'user';
    }

    // 建立用戶 (plan 可自行調整)
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role,
      plan: 'BASIC',
      socialBinding: JSON.stringify({
        IG, FB, YouTube, TikTok, Shopee,
        Ruten, Yahoo, Amazon, eBay, Taobao
      })
    });

    // (可選) 區塊鏈紀錄
    // try {
    //   await chain.writeCustomRecord('REGISTER', JSON.stringify({ email, userName, role }));
    // } catch (errChain) {
    //   console.error('[Register => blockchain error]', errChain);
    // }

    return res.status(201).json({
      message: '註冊成功',
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
    return res.status(500).json({ message: '註冊失敗，請稍後再試' });
  }
});

/* ------------------ 3) POST /auth/login ------------------ */
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, userName, password } = value;
    let user;
    // 依 email / userName 找人
    if (email) {
      user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    } else {
      user = await User.findOne({ where: { userName } });
    }
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 比對密碼
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 簽發 JWT (1h)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userName: user.userName,
        plan: user.plan,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: '登入失敗，請稍後再試' });
  }
});

/* ------------------ 4) (可選) /auth/loginByUserName ------------------ */
router.post('/loginByUserName', async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ message: '請提供 userName 與 password' });
    }

    const user = await User.findOne({ where: { userName } });
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // JWT => 24h
    const token = jwt.sign(
      {
        userId: user.id,
        userName: user.userName,
        plan: user.plan,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[loginByUserName Error]', err);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
});

module.exports = router;
