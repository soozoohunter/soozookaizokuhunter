// express/routes/auth.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');

// 請確保你的 User Model 有對應欄位
const User = require('../models/User');

// 假設我們已有封裝好的 mailer.js
// (若沒有 mailer.js，可直接在此使用 nodemailer)
const { sendMail } = require('../utils/mailer');

const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/**
 * 產生 JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * 寄送 Email 驗證碼
 */
async function sendVerificationEmail(toEmail, code) {
  const subject = 'Email 驗證碼 (Suzoo IP Hunter)';
  const htmlContent = `
    <p>您好，</p>
    <p>感謝您註冊 Suzoo IP Hunter 系統。以下是您的電子郵件驗證碼：</p>
    <h2 style="color:orange;">${code}</h2>
    <p>請在 10 分鐘內於系統中輸入此驗證碼完成驗證。</p>
    <p>若非本人操作，請忽略此郵件。</p>
  `;
  await sendMail(toEmail, subject, htmlContent);
}

/**
 * [POST] /auth/register
 */
router.post('/register', upload.none(), async (req, res) => {
  try {
    const {
      email,
      password,
      userName,
      facebook,
      instagram,
      youtube,
      tiktok,
      shopee,
      ruten,
      amazon,
      taobao
    } = req.body;

    if (!email || !password || !userName) {
      return res.status(400).json({ error: '缺少必填欄位 (email, password, userName)' });
    }

    // 檢查 Email 是否重複
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ error: '此 Email 已被註冊' });
    }

    // 雜湊密碼
    const hashed = await bcrypt.hash(password, 10);

    // 產生 6 位數驗證碼
    const code = crypto.randomInt(100000, 999999).toString();

    // 建立新用戶 (預設 plan = BASIC)
    const newUser = await User.create({
      email,
      password: hashed,
      userName,
      plan: 'BASIC',
      isEmailVerified: false,
      emailVerifyCode: code,

      // 若 User model 有以下欄位就一起存
      facebook,
      instagram,
      youtube,
      tiktok,
      shopee,
      ruten,
      amazon,
      taobao
    });

    // 寄送驗證碼
    await sendVerificationEmail(email, code);

    return res.json({
      message: '註冊成功，請檢查信箱驗證碼',
      userId: newUser.id,
      email: newUser.email
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * [POST] /auth/verifyEmail
 */
router.post('/verifyEmail', upload.none(), async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: '缺少 email 或 code' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    if (user.isEmailVerified) {
      return res.json({ message: '此帳號已驗證過，請直接登入' });
    }

    if (user.emailVerifyCode !== code) {
      return res.status(400).json({ error: '驗證碼不正確' });
    }

    // 驗證成功
    user.isEmailVerified = true;
    user.emailVerifyCode = null;
    await user.save();

    return res.json({ message: 'Email 驗證成功，請重新登入' });
  } catch (err) {
    console.error('[VerifyEmail Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * [POST] /auth/login
 * - 需先確認 email 已驗證 (isEmailVerified)
 */
router.post('/login', upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ error: 'Email 尚未驗證，請先驗證再登入' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    // 簽發 JWT
    const token = generateToken({ id: user.id, email: user.email });

    return res.json({
      message: '登入成功',
      token,
      plan: user.plan,
      userName: user.userName
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * [POST] /auth/logout
 */
router.post('/logout', (req, res) => {
  // 如果是 JWT (無狀態)，通常僅需前端刪除 token。
  return res.json({ message: '已登出' });
});

module.exports = router;
