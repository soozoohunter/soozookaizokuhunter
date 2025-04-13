// express/routes/auth.js

require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');

// 你的 User Model
const User = require('../models/User');

// 這裡假設你有 mailer.js 來 sendMail，若沒有，可自行直接改用 nodemailer
const { sendMail } = require('../utils/mailer');

// 用於接收表單
const upload = multer({ dest: 'uploads/' });

// 先前已經有的 JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/**
 * DB 裡面增加一個暫存欄位：
 *   tempEmailCode (用來存「尚未正式註冊，但已寄送驗證碼」的狀態)
 *   若您不想改 DB，可以考慮 Memory / Redis
 *   以下示範：在 `User` 的 Table 中臨時存 tempEmailCode, tempEmailCodeExp(10分鐘後失效)
 *   或乾脆建立一個「TempRegister」資料表 (較佳)，為簡化就直接掛在User Model
 */

/* 
  STEP1. 寄送驗證碼
  [POST] /auth/sendCode
  Body: { email }
*/
router.post('/sendCode', upload.none(), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: '缺少 Email' });
    }

    // 先檢查 DB 是否已經有這個 Email 註冊正式帳號
    const existUser = await User.findOne({ where: { email } });
    if (existUser && existUser.isEmailVerified) {
      // 若已經是正式帳號且驗證，則不允許重新註冊
      return res.status(400).json({ error: '此 Email 已被註冊並驗證' });
    }

    // 產生 6 碼驗證碼
    const code = crypto.randomInt(100000, 999999).toString();

    // Email 內容
    const subject = '【Suzoo】您的驗證碼';
    const htmlContent = `
      <p>您好，這是您的註冊驗證碼：</p>
      <h2 style="color:orange;">${code}</h2>
      <p>請在 10 分鐘內使用此碼完成驗證</p>
    `;
    await sendMail(email, subject, htmlContent);

    // 暫存到 DB (若該 Email 尚未建立 User 也行 => create 一筆?)
    // 這裡示範：若沒找到 User，就先 create(不設定 password)
    let user = existUser;
    if (!user) {
      user = await User.create({
        email,
        isEmailVerified: false
      });
    }

    // 設定 tempEmailCode, 10 分鐘後失效
    const expireTime = Date.now() + 10 * 60 * 1000; // 10分鐘後
    user.tempEmailCode = code;
    user.tempEmailCodeExp = expireTime;
    await user.save();

    return res.json({ message: '驗證碼已寄出，請查收信箱' });
  } catch (err) {
    console.error('[sendCode Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/* 
  STEP2. 檢查驗證碼
  [POST] /auth/checkCode
  Body: { email, code }
*/
router.post('/checkCode', upload.none(), async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: '缺少 email 或 code' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '尚未寄送驗證碼或用戶不存在' });
    }

    if (!user.tempEmailCode) {
      return res.status(400).json({ error: '尚未產生驗證碼' });
    }

    // 檢查是否過期
    if (Date.now() > user.tempEmailCodeExp) {
      return res.status(400).json({ error: '驗證碼已過期，請重新請求' });
    }

    // 比對
    if (user.tempEmailCode !== code) {
      return res.status(400).json({ error: '驗證碼不正確' });
    }

    // 如果驗證碼正確 => 回傳成功
    // 但尚未正式註冊(還沒填密碼 userName)
    return res.json({ message: '驗證碼正確，請繼續輸入其他資訊進行註冊' });
  } catch (err) {
    console.error('[checkCode Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/* 
  STEP3. 完成註冊
  [POST] /auth/finalRegister
  Body: {
    email,
    password1,
    password2,
    userName,
    facebook, instagram, youtube, tiktok,
    shopee, ruten, amazon, taobao
  }
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
      return res.status(400).json({ error: '缺少必填欄位' });
    }
    if (password1 !== password2) {
      return res.status(400).json({ error: '兩次密碼輸入不一致' });
    }

    // 找回 user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '請先寄送驗證碼並驗證成功後才可註冊' });
    }

    // 再檢查一次 tempEmailCodeExp 是否還在有效期 (避免 user 拿過期的 code)
    // 但若您要在 checkCode 時就清除 code 也可
    if (!user.tempEmailCode || Date.now() > user.tempEmailCodeExp) {
      return res.status(400).json({ error: '驗證碼已過期，請重新寄送' });
    }

    // Hash 密碼
    const hashedPwd = await bcrypt.hash(password1, 10);

    // 正式更新 user 註冊資料
    user.password = hashedPwd;
    user.userName = userName;
    user.facebook = facebook || null;
    user.instagram = instagram || null;
    user.youtube = youtube || null;
    user.tiktok = tiktok || null;
    user.shopee = shopee || null;
    user.ruten = ruten || null;
    user.amazon = amazon || null;
    user.taobao = taobao || null;

    user.isEmailVerified = true; // 直接視為已驗證
    user.tempEmailCode = null;
    user.tempEmailCodeExp = null;

    await user.save();

    return res.json({ message: '註冊成功，請重新登入', userId: user.id });
  } catch (err) {
    console.error('[finalRegister Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/* ==============================
   其餘 先前的 login / logout
   您仍可保留 (若需要)
   ============================== */
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
      return res.status(401).json({ error: 'Email 尚未驗證，請先完成驗證再登入' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    // 簽發 JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
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

router.post('/logout', (req, res) => {
  return res.json({ message: '已登出' });
});

module.exports = router;
