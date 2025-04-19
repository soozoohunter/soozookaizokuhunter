/********************************************************************
 * express/routes/auth.js
 * 
 * 完整整合：
 *   1) 註冊 (POST /register)
 *   2) 單一路由 (POST /login) => 同時支援 email 或 userName + password
 *   3) (可選) loginByUserName (若您暫時仍需沿用)
 * 
 * 使用 Sequelize + PostgreSQL (User.findOne / User.create)
 * 區塊鏈記錄 => chain.writeCustomRecord(...) (可自行擴充)
 ********************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User } = require('../models'); // Sequelize Model
const chain = require('../utils/chain');

// JWT秘鑰
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/* ------------------ Joi 驗證規則 ------------------ */

// 註冊用 (含 role 與社群欄位)
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  userName: Joi.string().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  // role：可為 copyright / trademark / both / user / admin
  // 若前端一定會傳，就維持 .required()
  // 若希望前端可不傳，可改 .optional()
  role: Joi.string().valid('copyright', 'trademark', 'both', 'user', 'admin').required(),
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

// 單一路由 login => 同時支援 email 或 userName
// 透過 xor('email','userName') => email 與 userName 擇一即可
const loginSchema = Joi.object({
  email: Joi.string().email(),
  userName: Joi.string(),
  password: Joi.string().required()
}).xor('email', 'userName');


/* ------------------ 1) 註冊路由 (POST /register) ------------------ */
router.post('/register', async (req, res) => {
  try {
    // 1. Joi 驗證
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // 解構
    const {
      email,
      userName,
      password,
      role
      // 其餘 IG, FB, Shopee... 若您要存 DB，可自行擴充
    } = value;

    // 2. 檢查是否已有相同 Email
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({ message: '此 Email 已被註冊' });
    }

    // 3. bcrypt 雜湊密碼
    const hashedPwd = await bcrypt.hash(password, 10);

    // 4. 建立新用戶 (plan='BASIC' 預設)
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role,
      plan: 'BASIC'
      // 若要存社群欄位，可存至 socialBinding 欄位
      // socialBinding: JSON.stringify({ IG, FB, YouTube, ... })
    });

    // 5. (可選) 區塊鏈紀錄
    try {
      await chain.writeCustomRecord('REGISTER', JSON.stringify({ email, userName, role }));
    } catch (e) {
      console.error('[Register => blockchain error]', e);
    }

    // 6. 回傳
    return res.status(201).json({
      message: '註冊成功',
      role: newUser.role
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ message: '註冊失敗，請稍後再試' });
  }
});


/* ------------------ 2) 單一路由 /login (POST) ------------------
   同時支援 email+password 或 userName+password
   預設 Token 有效期 1 小時
------------------------------------------------------- */
router.post('/login', async (req, res) => {
  try {
    // 1. Joi 驗證
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let { email, userName, password } = value;

    // 2. 二擇一 => email 或 userName
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (userName) {
      user = await User.findOne({ where: { userName } });
    }

    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 3. bcrypt compare
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 4. 簽發 JWT
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

    // 5. 回傳
    return res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: '登入失敗，請稍後再試' });
  }
});


/* ------------------ 3) (可選) /loginByUserName (POST) ------------------
   若您確定沒其他程式用到，可刪此避免重複。
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
      { userId: user.id, userName: user.userName, plan: user.plan, role: user.role },
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
