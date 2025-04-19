/**
 * express/controllers/authController.js
 * - 單一路由 /login 同時支援 email or userName + password
 * - 註冊時不包含商標 / 著作權欄位
 */
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // 由 ../models/index.js 匯出
const chain = require('../utils/chain');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/* ---------- Joi Schema ---------- */
// registerSchema：保留您現有欄位 (email, userName, password, confirmPassword, role, IG, FB ...)
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  userName: Joi.string().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  // 角色若前端沒傳就用後端預設
  role: Joi.string().valid('copyright', 'trademark', 'both', 'user', 'admin').optional(),
  // 以下社群欄位全可 optional
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

// loginSchema：xor('email', 'userName') -> email 或 userName 其一 + password
const loginSchema = Joi.object({
  email: Joi.string().email(),
  userName: Joi.string(),
  password: Joi.string().required()
}).xor('email', 'userName');

/* ---------- Controller ---------- */

// ★ 註冊
exports.register = async (req, res) => {
  try {
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
      IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, eBay, Taobao
    } = value;

    email = email.trim().toLowerCase(); // normalize email

    // 1) 檢查 email 是否已存在
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({ message: '此 Email 已被註冊' });
    }

    // 2) 檢查 userName 是否已存在
    const existUser = await User.findOne({ where: { userName } });
    if (existUser) {
      return res.status(400).json({ message: '使用者名稱已被使用' });
    }

    // 3) bcrypt hash
    const hashedPwd = await bcrypt.hash(password, 10);

    // 4) 預設 role = 'user' (若前端沒傳 or 傳了奇怪)
    let finalRole = (role === 'admin' || role === 'user') ? role : 'user';

    // 5) 建立 user (預設 plan='BASIC')
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role: finalRole,
      plan: 'BASIC',
      // 若您想把 IG, FB, ... 存進 DB 的 socialBinding，可以 JSON.stringify
      socialBinding: JSON.stringify({ IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, eBay, Taobao })
    });

    // 6) (可選) 區塊鏈紀錄
    try {
      await chain.writeCustomRecord('REGISTER', JSON.stringify({ email, userName, role: finalRole }));
    } catch (chainErr) {
      console.error('[Register => blockchain error]', chainErr);
    }

    // 7) 回傳
    return res.status(201).json({ message: '註冊成功', role: newUser.role });
  } catch (err) {
    console.error('[Register Error]', err);
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

// ★ 登入 (同一路由，可 email or userName 搭配 password)
exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let { email, userName, password } = value;
    if (email) email = email.trim().toLowerCase();

    // 1) 找出使用者
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (userName) {
      user = await User.findOne({ where: { userName } });
    }
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 2) bcrypt compare
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 3) 簽發 JWT (24h 有效)
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
