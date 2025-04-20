/**
 * express/routes/auth.js
 *
 * - POST /auth/register => 同時寫 DB 與區塊鏈
 * - POST /auth/login    => email or userName
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User } = require('../models'); // Sequelize
const { registerUserOnBlockchain } = require('../services/blockchainService');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/* ---------- 1) Joi schema ---------- */
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  userName: Joi.string().required(),
  password: Joi.string().required(),
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

const loginSchema = Joi.object({
  email: Joi.string().email(),
  userName: Joi.string(),
  password: Joi.string().required()
}).xor('email','userName');

/* ---------- 2) [POST] /register ---------- */
router.post('/register', async (req, res) => {
  try {
    // Joi驗證
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
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

    // 檢查密碼一致
    if (password !== confirmPassword) {
      return res.status(400).json({ error: '密碼與確認密碼不一致' });
    }

    // 正規化 email
    email = email.trim().toLowerCase();

    // 檢查重複
    const usedEmail = await User.findOne({ where: { email } });
    if (usedEmail) {
      return res.status(400).json({ error: '此 Email 已被註冊' });
    }
    const usedUser = await User.findOne({ where: { userName } });
    if (usedUser) {
      return res.status(400).json({ error: '使用者名稱已被使用' });
    }

    // bcrypt
    const hashedPwd = await bcrypt.hash(password, 10);

    // 預設 'user'
    if (!role || !['admin','user','copyright','trademark','both'].includes(role)) {
      role = 'user';
    }

    // 生成序號 (ex: 20250421-xxxxx)
    const dateStr = new Date().toISOString().replace(/[-:.T]/g, '').slice(0,8);
    const serialNumber = `${dateStr}-${Math.floor(Math.random() * 100000)}`;

    // 先建 DB user
    let newUser;
    try {
      newUser = await User.create({
        email,
        userName,
        password: hashedPwd,
        role,
        plan: 'BASIC',
        serialNumber,
        socialBinding: JSON.stringify({
          IG, FB, YouTube, TikTok,
          Shopee, Ruten, Yahoo, Amazon, eBay, Taobao
        })
      });
    } catch (dbErr) {
      console.error('[DB create error]', dbErr);
      return res.status(500).json({ error: '資料庫錯誤，無法建立使用者' });
    }

    // 呼叫區塊鏈
    try {
      await registerUserOnBlockchain(
        userName,
        role,
        serialNumber,
        { IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, eBay, Taobao }
      );
    } catch (chainErr) {
      console.error('[Chain Error]', chainErr);
      // 區塊鏈失敗 => rollback
      await newUser.destroy();
      return res.status(500).json({ error: '區塊鏈寫入失敗，註冊未完成' });
    }

    return res.status(201).json({ message: '註冊成功 (已寫入區塊鏈)' });
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
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: '註冊失敗，請稍後再試' });
  }
});

/* ---------- 3) [POST] /login ---------- */
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { email, userName, password } = value;

    // 依 email or userName 查
    let user;
    if (email) {
      user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    } else {
      user = await User.findOne({ where: { userName } });
    }
    if (!user) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    // bcrypt compare
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    // 簽發 JWT
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
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
});

/* ---------- 4) (可選) [POST] /loginByUserName ---------- */
router.post('/loginByUserName', async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ error: '請提供 userName 與 password' });
    }
    const user = await User.findOne({ where: { userName } });
    if (!user) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }
    // JWT
    const token = jwt.sign({ userId: user.id, userName, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[loginByUserName Error]', err);
    return res.status(500).json({ error: '伺服器錯誤' });
  }
});

module.exports = router;
