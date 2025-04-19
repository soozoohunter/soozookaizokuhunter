/********************************************************************
 * express/routes/auth.js
 *
 * 完整整合：
 *   1) 註冊 (POST /register)
 *   2) 單一路由 (POST /login) => 同時支援 email 或 userName + password
 *   3) (可選) loginByUserName (若仍需沿用)
 *
 * 使用 Sequelize + PostgreSQL (User.findOne / User.create)
 * 區塊鏈記錄 => chain.writeCustomRecord(...) (可自行擴充)
 * 
 * 在 server.js / app.js 中掛載:
 *   const authRoutes = require('./routes/auth');
 *   app.use('/auth', authRoutes);
 *
 * 最終端點:
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/loginByUserName  (可選)
 ********************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User } = require('../models'); // Sequelize Model (User)
const chain = require('../utils/chain'); // (可選) 區塊鏈寫入函式

// 讀取 JWT 秘鑰
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/* ------------------ 1) Joi 驗證規則 ------------------ */

// 註冊用 (含 role 與社群欄位)
// ★ role 改為 optional；若前端未傳 => 後端預設 'user'
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  userName: Joi.string().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  role: Joi.string().valid('copyright', 'trademark', 'both', 'user', 'admin')
            .optional(),  // 前端可不傳，後端預設 'user'
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

// 單一路由 login => 同時支援 email 或 userName (擇一) + password
// 透過 xor('email','userName')
const loginSchema = Joi.object({
  email: Joi.string().email(),
  userName: Joi.string(),
  password: Joi.string().required()
}).xor('email', 'userName');


/* ------------------ 2) 註冊路由 (POST /register) ------------------ */
router.post('/register', async (req, res) => {
  try {
    // (A) Joi 驗證表單
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // (B) 解構 + 正規化
    let {
      email,
      userName,
      password,
      role, // optional
      IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, eBay, Taobao
    } = value;
    email = email.trim().toLowerCase();

    // (C) 檢查 Email 是否已被註冊
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({ message: '此 Email 已被註冊' });
    }

    // (D) 檢查 userName 是否已使用
    const existUserName = await User.findOne({ where: { userName } });
    if (existUserName) {
      return res.status(400).json({ message: '使用者名稱已被使用' });
    }

    // (E) bcrypt 雜湊
    const hashedPwd = await bcrypt.hash(password, 10);

    // (F) 若 role 不合法 (或未傳), 預設 'user'
    if (!role || !['admin','user','copyright','trademark','both'].includes(role)) {
      role = 'user';
    }

    // (G) 建立用戶 (plan='BASIC' 為示範，您可自行改)
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role,
      plan: 'BASIC',
      // 若要存 IG,FB,Shopee... 到同一欄位 => JSON.stringify
      socialBinding: JSON.stringify({
        IG, FB, YouTube, TikTok, Shopee,
        Ruten, Yahoo, Amazon, eBay, Taobao
      })
    });

    // (H) (可選) 區塊鏈紀錄
    try {
      await chain.writeCustomRecord(
        'REGISTER',
        JSON.stringify({ email, userName, role })
      );
    } catch (chainErr) {
      console.error('[Register => blockchain error]', chainErr);
    }

    // (I) 回傳
    return res.status(201).json({
      message: '註冊成功',
      role: newUser.role
    });

  } catch (err) {
    console.error('[Register Error]', err);
    // 針對 Sequelize Unique Constraint
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


/* ------------------ 3) 單一路由 /login (POST) ------------------
   同時支援 email+password 或 userName+password
   預設 token 有效期 1 小時
---------------------------------------------------------------- */
router.post('/login', async (req, res) => {
  try {
    // (A) Joi 驗證
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let { email, userName, password } = value;
    if (email) {
      email = email.trim().toLowerCase();
    }

    // (B) 找出使用者 => email 或 userName
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else {
      user = await User.findOne({ where: { userName } });
    }

    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // (C) bcrypt compare
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // (D) 簽發 JWT
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

    // (E) 回傳
    return res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: '登入失敗，請稍後再試' });
  }
});


/* ------------------ 4) (可選) /loginByUserName (POST) ------------------
   若您確定沒其他程式用到，可刪除此段避免重複功能。
----------------------------------------------------------------------- */
router.post('/loginByUserName', async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ message: '請提供使用者名稱及密碼' });
    }

    const user = await User.findOne({ where: { userName } });
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // JWT (24h)
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

    return res.json({ message: '登入成功！', token });
  } catch (err) {
    console.error('[loginByUserName Error]', err);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
});


/* ------------------ 匯出路由 ------------------ */
module.exports = router;
