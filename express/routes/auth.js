require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const User = require('../models/User');
const { sendMail } = require('../utils/mailer');

const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/**
 * STEP1. 寄送驗證碼 /auth/sendCode
 */
router.post('/sendCode', upload.none(), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error:'缺少 Email' });

    // 檢查是否已經註冊了
    let user = await User.findOne({ where: { email } });
    if (user && user.isEmailVerified) {
      return res.status(400).json({ error:'此 Email 已被註冊並驗證' });
    }

    // 產生 6 位數碼
    const code = crypto.randomInt(100000,999999).toString();

    // 寄送
    const subject = '【Suzoo】您的驗證碼';
    const content = `
      <p>您好，這是您的註冊驗證碼：</p>
      <h2 style="color:orange;">${code}</h2>
      <p>請在 10 分鐘內使用此碼完成驗證</p>
    `;
    await sendMail(email, subject, content);

    // 若尚未在資料庫有 user，就 create 一筆
    if (!user) {
      user = await User.create({ email, isEmailVerified:false });
    }

    // 暫存到 DB
    const expireTime = Date.now() + 10*60*1000; // 10分鐘後到期
    user.tempEmailCode = code;
    user.tempEmailCodeExp = expireTime;
    await user.save();

    return res.json({ message:'驗證碼已寄出，請查收信箱' });
  } catch (e) {
    console.error('[sendCode Error]', e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * STEP2. 檢查驗證碼 /auth/checkCode
 */
router.post('/checkCode', upload.none(), async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error:'缺少 email 或 code' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error:'尚未寄送驗證碼或用戶不存在' });

    // 檢查是否過期
    if (!user.tempEmailCode || Date.now() > user.tempEmailCodeExp) {
      return res.status(400).json({ error:'驗證碼已過期，請重新寄送' });
    }
    if (user.tempEmailCode !== code) {
      return res.status(400).json({ error:'驗證碼不正確' });
    }

    // 驗證成功 (但尚未正式註冊)
    return res.json({ message:'驗證碼正確' });
  } catch (e) {
    console.error('[checkCode Error]', e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * STEP3. 完成註冊 /auth/finalRegister
 */
router.post('/finalRegister', upload.none(), async (req, res) => {
  try {
    const {
      email,
      password1,
      password2,
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
    if (!email || !password1 || !password2 || !userName) {
      return res.status(400).json({ error:'缺少必填欄位' });
    }
    if (password1 !== password2) {
      return res.status(400).json({ error:'兩次密碼不一致' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error:'請先寄送驗證碼並驗證後才能註冊' });
    }

    if (!user.tempEmailCode || Date.now() > user.tempEmailCodeExp) {
      return res.status(400).json({ error:'驗證碼已過期，請重新寄送' });
    }

    // 正式寫入
    const hashedPwd = await bcrypt.hash(password1, 10);
    user.password = hashedPwd;
    user.userName = userName;
    user.facebook = facebook || '';
    user.instagram= instagram || '';
    user.youtube  = youtube || '';
    user.tiktok   = tiktok || '';
    user.shopee   = shopee || '';
    user.ruten    = ruten || '';
    user.amazon   = amazon || '';
    user.taobao   = taobao || '';
    user.isEmailVerified = true;

    // 清空暫存
    user.tempEmailCode = null;
    user.tempEmailCodeExp = null;
    await user.save();

    return res.json({ message:'註冊成功', userId:user.id });
  } catch (e) {
    console.error('[finalRegister Error]', e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * 登入 /auth/login
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
      return res.status(401).json({ error:'Email 尚未驗證，請先完成註冊流程' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    const token = jwt.sign({ id:user.id, email:user.email }, JWT_SECRET, { expiresIn:'1h' });
    return res.json({ message:'登入成功', token });
  } catch (e) {
    console.error('[Login Error]', e);
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
