// express/routes/auth.js

const express = require('express');
const router = express.Router();

// 使用 bcryptjs 取代 bcrypt
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const { User } = require('../models');
const { generateCode, verifyCode, removeCode } = require('../utils/VerificationCode');
const { createCaptcha, verifyCaptcha } = require('../utils/captcha');
const chain = require('../utils/chain');

// nodemailer 設定 (請確保 .env SMTP_HOST / SMTP_USER / SMTP_PASS 已正確)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
  }
});

// 1) 取得 CAPTCHA (GET)
router.get('/captcha', (req, res) => {
  const { captchaId, text } = createCaptcha();
  // 此示範直接回傳文字給前端; 實務可用 SVG 圖片
  return res.json({ captchaId, captchaText: text });
});

// 2) 寄送 Email 驗證碼 (Step 1)
router.post('/sendCode', async (req, res) => {
  try {
    const { email, captchaId, captchaText } = req.body;
    // 驗證 CAPTCHA
    if (!verifyCaptcha(captchaId, captchaText)) {
      return res.status(400).json({ message: 'CAPTCHA 錯誤或已過期' });
    }
    // 檢查 Email 是否重複
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: '此 Email 已註冊過' });
    }
    // 產生驗證碼
    const code = generateCode(email);

    // 寄送郵件
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: '會員驗證碼',
      text: `您的驗證碼是：${code}\n5分鐘內有效`
    };
    await transporter.sendMail(mailOptions);

    return res.json({ message: '驗證碼已寄出' });
  } catch (err) {
    console.error('Error in /auth/sendCode:', err);
    return res.status(500).json({ message: '驗證碼寄送失敗' });
  }
});

// 3) 驗證碼是否正確 (Step 2)
router.post('/checkCode', (req, res) => {
  try {
    const { email, code, captchaId, captchaText } = req.body;
    // 驗證 CAPTCHA
    if (!verifyCaptcha(captchaId, captchaText)) {
      return res.status(400).json({ message: 'CAPTCHA 錯誤或已過期' });
    }
    // 驗證碼
    const valid = verifyCode(email, code);
    if (!valid) {
      return res.status(400).json({ message: '驗證碼錯誤或已過期' });
    }
    return res.json({ message: '驗證碼正確' });
  } catch (err) {
    console.error('Error in /auth/checkCode:', err);
    return res.status(500).json({ message: '驗證碼檢查失敗' });
  }
});

// 4) 完成註冊 (Step 3)
router.post('/finalRegister', async (req, res) => {
  try {
    const {
      email,
      code,
      password,
      igAccount,
      facebookAccount,
      tiktokAccount,
      captchaId,
      captchaText
    } = req.body;

    // 驗證 CAPTCHA
    if (!verifyCaptcha(captchaId, captchaText)) {
      return res.status(400).json({ message: 'CAPTCHA 錯誤或已過期' });
    }

    // 驗證碼
    const valid = verifyCode(email, code);
    if (!valid) {
      return res.status(400).json({ message: '驗證碼錯誤或已過期' });
    }
    removeCode(email); // 使用後刪除

    // 檢查 Email
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({ message: '此 Email 已註冊過' });
    }

    // 檢查 IG / FB / Tiktok (若有填寫則檢查唯一性)
    if (igAccount) {
      const existIG = await User.findOne({ where: { igAccount } });
      if (existIG) {
        return res.status(400).json({ message: '此 IG 帳號已被使用' });
      }
    }
    if (facebookAccount) {
      const existFB = await User.findOne({ where: { facebookAccount } });
      if (existFB) {
        return res.status(400).json({ message: '此 Facebook 帳號已被使用' });
      }
    }
    if (tiktokAccount) {
      const existTT = await User.findOne({ where: { tiktokAccount } });
      if (existTT) {
        return res.status(400).json({ message: '此 TikTok 帳號已被使用' });
      }
    }

    // 加密密碼 (改用 bcryptjs)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 建立新用戶
    const newUser = await User.create({
      email,
      password: hashedPassword,
      igAccount: igAccount || null,
      facebookAccount: facebookAccount || null,
      tiktokAccount: tiktokAccount || null
    });

    // 上鏈(可選)
    try {
      const dataToChain = `${email}|IG:${igAccount || ''}|FB:${facebookAccount || ''}|TT:${tiktokAccount || ''}`;
      await chain.writeCustomRecord('REGISTER', dataToChain);
    } catch (chainErr) {
      console.error('[finalRegister] 上鏈失敗，但不影響帳號建立:', chainErr);
    }

    return res.json({ message: '註冊成功' });
  } catch (err) {
    console.error('Error in /auth/finalRegister:', err);
    return res.status(500).json({ message: '註冊失敗，請稍後再試' });
  }
});

// 5) 登入
router.post('/login', async (req, res) => {
  try {
    const { email, password, captchaId, captchaText } = req.body;

    // 驗證 CAPTCHA
    if (!verifyCaptcha(captchaId, captchaText)) {
      return res.status(400).json({ message: 'CAPTCHA 錯誤或已過期' });
    }

    // 找使用者
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }
    // 密碼比對 (改用 bcryptjs)
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 發 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'KaiKaiShieldSecret',
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('Error in /auth/login:', err);
    return res.status(500).json({ message: '登入失敗，請稍後再試' });
  }
});

module.exports = router;
