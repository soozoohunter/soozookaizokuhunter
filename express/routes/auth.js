/**
 * express/routes/auth.js
 *
 * - POST /auth/register => 註冊 (支援 email + userName + bcrypt 雜湊 + 可寫入區塊鏈)
 * - POST /auth/login    => 同時支援 email or userName + password
 * - (可選) POST /auth/loginByUserName => 若歷史需求保留
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User } = require('../models');

// ★ 如您有寫入區塊鏈的需求，可引入以下服務：
// const { registerUserOnBlockchain } = require('../services/blockchainService');
// 或 const chain = require('../utils/chain');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/* ------------------------------------------------------------------
   1) Joi Schema 註冊 / 登入
   ------------------------------------------------------------------ */

// 註冊表單 (支援 email / userName / password + confirmPassword + role...)
// 放寬規則：使用 .allow('') 允許社群/電商欄位可空
// 密碼如要更嚴格，可加入 Regex，這裡示範最小 8 字元即可
const registerSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required()
    .messages({
      'string.email': 'Email 格式不正確',
      'any.required': 'Email 為必填'
    }),
  userName: Joi.string().min(3).max(30).trim().required()
    .messages({
      'string.min': '使用者名稱至少 3 碼',
      'any.required': '使用者名稱為必填'
    }),
  password: Joi.string().min(8).required()
    .messages({
      'string.min': '密碼至少 8 碼',
      'any.required': '密碼為必填'
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': '密碼與確認密碼不一致' }),
  role: Joi.string().valid('admin','user','copyright','trademark','both')
           .optional(),

  // 社群 / 電商欄位全允許空字串
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

// 登入表單 => 同時支援 email or userName + password (二擇一)
const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase(),
  userName: Joi.string().trim(),
  password: Joi.string().required()
})
// 改用 .or => 允許至少填 email 或 userName 之一
.or('email','userName')
.messages({
  'object.missing': '請輸入 email 或使用者名稱',
  'any.required': '密碼為必填'
});

/* ------------------------------------------------------------------
   2) POST /register => 註冊 + (可選) 區塊鏈寫入
   ------------------------------------------------------------------ */
router.post('/register', async (req, res) => {
  try {
    // (A) Joi 驗證前端送來的資料
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      // 可能有多筆錯誤 => 收集並回傳
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ errors: messages });
    }

    // 從驗證後的 value 解構
    let {
      email,
      userName,
      password,
      confirmPassword,
      role,
      IG, FB, YouTube, TikTok, Shopee,
      Ruten, Yahoo, Amazon, eBay, Taobao
    } = value;

    // (B) 檢查 email/userName 是否重複
    const usedEmail = await User.findOne({ where: { email } });
    if (usedEmail) {
      return res.status(400).json({ message: '此 Email 已被註冊' });
    }
    const usedUser = await User.findOne({ where: { userName } });
    if (usedUser) {
      return res.status(400).json({ message: '使用者名稱已被使用' });
    }

    // (C) bcrypt 雜湊
    const hashedPwd = await bcrypt.hash(password, 10);

    // (D) role 不在清單 => 預設 'user'
    if (!role || !['admin','user','copyright','trademark','both'].includes(role)) {
      role = 'user';
    }

    // (E) 建立使用者 (plan 可自行決定)
    // 若您要生成 serialNumber，可在這裡組裝
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role,
      plan: 'BASIC',
      socialBinding: JSON.stringify({
        IG, FB, YouTube, TikTok,
        Shopee, Ruten, Yahoo, Amazon, eBay, Taobao
      })
    });

    // (F) 區塊鏈寫入 (可選)
    // try {
    //   await registerUserOnBlockchain(
    //     userName,
    //     role,
    //     newUser.serialNumber, // 如果您在 DB 另存了 serialNumber
    //     { IG, FB, YouTube, ... }
    //   );
    // } catch (chainErr) {
    //   console.error('[Chain Error]', chainErr);
    //   // 區塊鏈失敗 => 如果您想 rollback，可:
    //   // await newUser.destroy();
    //   // return res.status(500).json({ message: '區塊鏈寫入失敗' });
    // }

    return res.status(201).json({
      message: '註冊成功',
      role: newUser.role
    });

  } catch (err) {
    console.error('[Register Error]', err);
    // UNIQUE 衝突
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

/* ------------------------------------------------------------------
   3) POST /login => 同時支援 email 或 userName
   ------------------------------------------------------------------ */
router.post('/login', async (req, res) => {
  try {
    // (A) Joi 驗證
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      // 只返回第一個錯誤
      const firstMsg = error.details[0].message;
      return res.status(400).json({ message: firstMsg });
    }

    const { email, userName, password } = value;

    // (B) 找 user => email or userName
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (userName) {
      user = await User.findOne({ where: { userName } });
    }
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // (C) bcrypt.compare
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // (D) 簽發 JWT
    const token = jwt.sign({
      userId: user.id,
      userName: user.userName,
      email: user.email,
      role: user.role,
      plan: user.plan
    }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: '登入失敗，請稍後再試' });
  }
});

/* ------------------------------------------------------------------
   4) (可選) POST /loginByUserName => 若您需要歷史相容
   ------------------------------------------------------------------ */
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

    // 24h Token
    const token = jwt.sign({
      userId: user.id,
      userName: user.userName,
      role: user.role,
      plan: user.plan
    }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[loginByUserName Error]', err);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
});

module.exports = router;
