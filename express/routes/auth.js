const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// 引入驗證碼工具 (使用記憶體 Map 暫存驗證碼)
const { generateCode, verifyCode, removeCode } = require('../utils/VerificationCode');
// 引入 User 資料模型 (Sequelize)
const { User } = require('../models');

// 設定 Gmail SMTP 發信
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 寄送驗證碼
router.post('/sendCode', async (req, res) => {
  const { email } = req.body;
  try {
    // 檢查 Email 是否已被註冊
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '此 Email 已註冊過' });
    }
    // 產生驗證碼並發送郵件
    const code = generateCode(email);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '會員驗證碼 Verification Code',
      text: `您的會員驗證碼為: ${code}\nThis is your verification code: ${code}`
    });
    return res.json({ message: '驗證碼已寄出' });
  } catch (err) {
    console.error('Error in /auth/sendCode:', err);
    return res.status(500).json({ message: '驗證碼寄送失敗' });
  }
});

// 驗證輸入的驗證碼
router.post('/checkCode', (req, res) => {
  const { email, code } = req.body;
  // 檢查驗證碼是否正確且未過期
  const valid = verifyCode(email, code);
  if (!valid) {
    return res.status(400).json({ message: '驗證碼錯誤或已過期' });
  }
  return res.json({ message: '驗證碼正確' });
});

// 完成註冊 (建立帳號)
router.post('/finalRegister', async (req, res) => {
  const { email, password, code } = req.body;
  try {
    // 再次驗證驗證碼（防止跳過前一步）
    const valid = verifyCode(email, code);
    if (!valid) {
      return res.status(400).json({ message: '驗證碼錯誤或已過期' });
    }
    // 檢查 Email 是否重複
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '此 Email 已註冊過' });
    }
    // 建立新使用者帳號 (此範例未加密密碼，實務上應先雜湊)
    const newUser = await User.create({ email, password });
    // 移除已使用的驗證碼
    removeCode(email);
    return res.json({ message: '註冊成功' });
  } catch (err) {
    console.error('Error in /auth/finalRegister:', err);
    return res.status(500).json({ message: '註冊失敗，請稍後再試' });
  }
});

// 使用者登入，回傳 JWT Token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }
    // 檢查密碼是否正確
    if (user.password !== password) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }
    // 簽發 JWT Token（有效期1小時）
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({ token });
  } catch (err) {
    console.error('Error in /auth/login:', err);
    return res.status(500).json({ message: '登入失敗，請稍後再試' });
  }
});

module.exports = router;
