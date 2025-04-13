const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// ★ 若您要把驗證碼暫存於資料庫，可改成 import VerificationCode from '...';
//   這裡示範 "記憶體暫存" 方式:
const VerificationCode = require('../utils/VerificationCode'); 
// import { User } from '../models'; // 若您要操作資料庫中的 User

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/**
 * [POST] /auth/sendCode
 * 產生 6 碼驗證碼並寄送給使用者
 */
router.post('/sendCode', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    // 產生驗證碼
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 暫存或寫進 DB
    VerificationCode.saveCode(email, code);

    // 檢查環境變數
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('未設定 EMAIL_USER/EMAIL_PASS');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // 使用 Gmail (建議應用程式密碼)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 寄出 Email
    await transporter.sendMail({
      from: `"Suzoo應用" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '您的驗證碼 (Suzoo)',
      text: `您的驗證碼為: ${code}，請在 5 分鐘內使用`
    });

    return res.json({ message: '驗證碼已發送' });
  } catch (err) {
    console.error('[sendCode] error:', err);
    return res.status(500).json({ error: '寄送驗證碼失敗' });
  }
});

/**
 * [POST] /auth/checkCode
 * 驗證碼比對
 */
router.post('/checkCode', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: '缺少 email 或 code' });
  }
  const valid = VerificationCode.verifyCode(email, code);
  if (!valid) {
    return res.status(400).json({ error: '驗證碼錯誤或已過期' });
  }
  return res.json({ message: '驗證碼正確，請繼續註冊' });
});

/**
 * [POST] /auth/finalRegister
 * 在驗證碼正確後，寫入使用者資料
 */
router.post('/finalRegister', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }
    // 檢查驗證狀態
    if (!VerificationCode.isVerified(email)) {
      return res.status(400).json({ error: 'Email 尚未通過驗證碼驗證' });
    }

    // TODO: 查詢 DB 是否已存在 user
    // const existUser = await User.findOne({ where: { email }});
    // if (existUser) {
    //   return res.status(400).json({ error: '此 Email 已被註冊' });
    // }
    // 加密密碼
    const hashed = await bcrypt.hash(password, 10);
    // 新增 user
    // await User.create({ email, password: hashed, plan: 'BASIC', ... });

    // 完成後清除驗證碼
    VerificationCode.clearCode(email);
    return res.json({ message: '註冊成功' });
  } catch (err) {
    console.error('[finalRegister] error:', err);
    return res.status(500).json({ error: '註冊失敗' });
  }
});

/**
 * [POST] /auth/login
 * 登入
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    // 依需求查詢 user，並比對密碼
    // const user = await User.findOne({ where: { email }});
    // if (!user) {
    //   return res.status(401).json({ error: '使用者不存在' });
    // }
    // const match = await bcrypt.compare(password, user.password);
    // if (!match) {
    //   return res.status(401).json({ error: '密碼錯誤' });
    // }

    // 簽發 JWT
    const token = jwt.sign(
      { email }, // or { id: user.id, email: user.email}
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ message: '登入成功', token });
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ error: '登入失敗' });
  }
});

module.exports = router;
