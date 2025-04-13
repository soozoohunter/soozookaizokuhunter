const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// 載入 Sequelize 模型
const { User, VerificationCode } = require('../models');

// 設定寄信服務 (這裡以 Gmail 為例，需要在 .env 中提供帳號密碼)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 工具函式：產生六位數驗證碼
function generateVerificationCode() {
  // 生成 100000 到 999999 的隨機整數，轉為字串，不足6位時補零
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString().padStart(6, '0');
}

// 發送驗證碼 API
router.post('/sendCode', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email 未提供' });
  }
  try {
    // 檢查是否已有該 Email 的帳號
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '此 Email 已註冊過帳號' });
    }
    // 產生驗證碼
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分鐘後過期

    // 檢查是否已存在尚未使用的驗證碼紀錄
    let codeRecord = await VerificationCode.findOne({ where: { email } });
    if (codeRecord) {
      // 更新驗證碼與有效期限
      codeRecord.code = code;
      codeRecord.expiresAt = expiresAt;
      await codeRecord.save();
    } else {
      // 建立新的驗證碼紀錄
      codeRecord = await VerificationCode.create({ email, code, expiresAt });
    }

    // 寄送驗證碼郵件
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '會員註冊驗證碼',
      text: `您的驗證碼是：${code}，請在10分鐘內完成驗證。`
    };
    await transporter.sendMail(mailOptions);

    return res.json({ message: '驗證碼已發送' });
  } catch (error) {
    console.error('sendCode error:', error);
    return res.status(500).json({ message: '伺服器錯誤，無法發送驗證碼' });
  }
});

// 驗證碼確認 API
router.post('/checkCode', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: '參數不足' });
  }
  try {
    const codeRecord = await VerificationCode.findOne({ where: { email } });
    if (!codeRecord) {
      return res.status(400).json({ message: '請先申請驗證碼' });
    }
    // 檢查驗證碼是否過期
    if (new Date() > codeRecord.expiresAt) {
      // 已過期，刪除這筆驗證碼紀錄
      await VerificationCode.destroy({ where: { email } });
      return res.status(400).json({ message: '驗證碼已過期，請重新申請' });
    }
    // 驗證碼是否正確
    if (codeRecord.code !== code) {
      return res.status(400).json({ message: '驗證碼錯誤' });
    }
    // 驗證成功
    return res.json({ message: '驗證成功' });
  } catch (error) {
    console.error('checkCode error:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
});

// 最終註冊 API
router.post('/finalRegister', async (req, res) => {
  const { email, code, username, password, facebook, instagram, youtube, tiktok, shopee, ruten, amazon, taobao } = req.body;
  if (!email || !code || !username || !password) {
    return res.status(400).json({ message: '參數不足' });
  }
  try {
    // 查詢驗證碼紀錄
    const codeRecord = await VerificationCode.findOne({ where: { email } });
    if (!codeRecord) {
      return res.status(400).json({ message: '請先完成驗證碼發送流程' });
    }
    // 檢查驗證碼是否過期
    if (new Date() > codeRecord.expiresAt) {
      await VerificationCode.destroy({ where: { email } });
      return res.status(400).json({ message: '驗證碼已過期，請重新申請' });
    }
    // 檢查驗證碼是否正確
    if (codeRecord.code !== code) {
      return res.status(400).json({ message: '驗證碼錯誤' });
    }
    // 檢查帳號或用戶名稱是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '此 Email 已存在帳號，無法重複註冊' });
    }
    const existingName = await User.findOne({ where: { username } });
    if (existingName) {
      return res.status(400).json({ message: '用戶名稱已被使用，請選擇其他名稱' });
    }
    // 哈希密碼
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // 建立新使用者
    await User.create({
      email,
      username,
      password: hashedPassword,
      facebook: facebook || '',
      instagram: instagram || '',
      youtube: youtube || '',
      tiktok: tiktok || '',
      shopee: shopee || '',
      ruten: ruten || '',
      amazon: amazon || '',
      taobao: taobao || ''
    });
    // 新增成功後刪除驗證碼紀錄（避免重複使用）
    await VerificationCode.destroy({ where: { email } });
    return res.json({ message: '註冊成功' });
  } catch (error) {
    console.error('finalRegister error:', error);
    return res.status(500).json({ message: '伺服器錯誤，無法完成註冊' });
  }
});

// 登入 API
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: '請提供帳號和密碼' });
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }
    // 產生 JWT（有效期可自行調整，例如 1 天）
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ 
      message: '登入成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
});

module.exports = router;
