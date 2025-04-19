/**
 * express/controllers/authController.js
 * - 單一路由 /login 同時支援 email or userName + password
 * - 註冊時可包含 role 與社群欄位 (IG, FB, Shopee...)，但不含商標 / 著作權
 * - 依照您原先的 Sequelize + chain.writeCustomRecord 邏輯做整合
 */
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');  // 由 ../models/index.js 匯出
const chain = require('../utils/chain'); // 若您已有區塊鏈記錄需求

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/* ------------------------------------------------------------------
   1) Joi Schema 定義
   ------------------------------------------------------------------ */
// registerSchema：保留您現有欄位 (email, userName, password, confirmPassword, role, IG, FB ...)
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  userName: Joi.string().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  // ★ 若前端沒傳 role，就後端預設 'user'；schema 只做校驗，但可 optional
  role: Joi.string().valid('copyright', 'trademark', 'both', 'user', 'admin').optional(),
  // 以下社群 / 電商欄位全可 optional
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

// loginSchema：xor('email', 'userName') => email 與 userName 擇一必填 + password
const loginSchema = Joi.object({
  email: Joi.string().email(),
  userName: Joi.string(),
  password: Joi.string().required()
}).xor('email', 'userName');


/* ------------------------------------------------------------------
   2) Controller 函式：註冊 register
   ------------------------------------------------------------------ */
exports.register = async (req, res) => {
  try {
    // Joi 驗證
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // 解構取值 (多餘欄位也可一併取出)
    let {
      email,
      userName,
      password,
      confirmPassword,
      role,  // optional
      IG, FB, YouTube, TikTok, Shopee,
      Ruten, Yahoo, Amazon, eBay, Taobao
    } = value;

    // email 正規化
    email = email.trim().toLowerCase();

    // 檢查重複 Email
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

    // 若 role 非 'admin'/'user'，則預設 'user'
    let finalRole = (role === 'admin' || role === 'user') ? role : 'user';

    // 建立新用戶 (預設 plan = 'BASIC' 可改)
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role: finalRole,
      plan: 'BASIC',
      // 若您想存社群欄位於同一 DB 欄位，可統一 JSON.stringify
      socialBinding: JSON.stringify({
        IG, FB, YouTube, TikTok, Shopee,
        Ruten, Yahoo, Amazon, eBay, Taobao
      })
    });

    // (可選) 區塊鏈紀錄
    try {
      await chain.writeCustomRecord(
        'REGISTER',
        JSON.stringify({ email, userName, role: finalRole })
      );
    } catch (chainErr) {
      console.error('[Register => blockchain error]', chainErr);
    }

    // 回傳
    return res.status(201).json({
      message: '註冊成功',
      role: newUser.role
    });

  } catch (err) {
    console.error('[Register Error]', err);
    // 捕捉 Sequelize Unique Constraint
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors && err.errors[0] && err.errors[0].path;
      let message = '資料重複無法使用';
      if (field === 'email') {
        message = '此 Email 已被註冊';
      } else if (field === 'userName') {
        message = '使用者名稱已被使用';
      }
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message: '註冊失敗，請稍後再試' });
  }
};


/* ------------------------------------------------------------------
   3) Controller 函式：登入 login (同一路由，支援 email / userName)
   ------------------------------------------------------------------ */
exports.login = async (req, res) => {
  try {
    // Joi 驗證
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let { email, userName, password } = value;
    if (email) email = email.trim().toLowerCase();

    // 依 email 或 userName 找使用者
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

    // 簽發 JWT (24h)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userName: user.userName,
        plan: user.plan,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: '登入失敗，請稍後再試' });
  }
};
