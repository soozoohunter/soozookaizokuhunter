/********************************************************************
 * express/routes/auth.js
 * 完整整合：
 *   1) 註冊 (register)
 *   2) 單一路由 /login => 同時支援 email 或 userName + password
 *   3) (可選) loginByUserName (保留以防您已使用)
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
// 注意 xor('email','userName')，表示必須擇一
const loginSchema = Joi.object({
  email: Joi.string().email(),
  userName: Joi.string(),
  password: Joi.string().required()
}).xor('email', 'userName');


/* ------------------ 註冊 ------------------ */
router.post('/register', async (req, res) => {
  try {
    // Joi 驗證
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, userName, password, role } = value;

    // 檢查重複 Email
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ message: '此 Email 已被註冊' });
    }

    // bcrypt 雜湊密碼
    const hashedPwd = await bcrypt.hash(password, 10);

    // 建立新用戶 (預設 plan: 'BASIC')
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role,
      plan: 'BASIC'
    });

    // (可選) 區塊鏈紀錄
    try {
      await chain.writeCustomRecord('REGISTER', JSON.stringify({ email, userName, role }));
    } catch (e) {
      console.error('[Register => blockchain error]', e);
    }

    return res.status(201).json({ message: '註冊成功', role: newUser.role });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ message: '註冊失敗，請稍後再試' });
  }
});


/* ------------------ 單一路由 /login ------------------
   同時支援 email+password 或 userName+password
   (若您想省略 loginByUserName，僅保留此路由即可)
------------------------------------------------------- */
router.post('/login', async (req, res) => {
  try {
    // Joi 驗證
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let { email, userName, password } = value;

    // 二選一 => email 或 userName
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (userName) {
      user = await User.findOne({ where: { userName } });
    }

    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // bcrypt compare
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 簽發 JWT
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


/* ------------------ (可選) loginByUserName ------------------
   若您確定已無使用，可刪除此路由以避免重複。 */
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

    // 簽發 JWT
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


module.exports = router;
