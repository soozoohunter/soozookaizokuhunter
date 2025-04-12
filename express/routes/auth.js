// express/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');

const User = require('../models/User');
require('dotenv').config();

const upload = multer({ dest:'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn:'1h' });
}

// 寄送 Email 驗證碼 (範例：console.log)
async function sendVerificationEmail(toEmail, code){
  // TODO: 可改用 nodemailer 或第三方 Email API
  console.log(`(偽) 寄送驗證信到 ${toEmail}，驗證碼: ${code}`);
}

// 註冊：先建立帳號 (isEmailVerified=false)，並寄出驗證碼
router.post('/register', upload.none(), async(req,res)=>{
  try {
    const { email, password, userName } = req.body;
    if(!email || !password || !userName) {
      return res.status(400).json({ error:'缺少必填欄位 (email, password, userName)' });
    }
    const exist = await User.findOne({ where:{ email } });
    if(exist) {
      return res.status(400).json({ error:'此 Email 已被註冊' });
    }
    const hashed = await bcrypt.hash(password,10);

    // 產生 6 碼驗證碼
    const code = crypto.randomInt(100000, 999999).toString();

    const newUser = await User.create({
      email,
      password: hashed,
      userName,
      plan: 'BASIC', // 初始皆為 BASIC
      isEmailVerified: false,
      emailVerifyCode: code
    });

    // 寄送驗證碼
    await sendVerificationEmail(email, code);

    return res.json({
      message:'註冊成功，請檢查信箱驗證',
      userId: newUser.id,
      email: newUser.email
    });
  } catch(err){
    console.error('[Register Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

// 驗證 Email：使用者拿到寄出的 code，在前端輸入後呼叫此 API
router.post('/verifyEmail', upload.none(), async(req,res)=>{
  try {
    const { email, code } = req.body;
    if(!email || !code){
      return res.status(400).json({ error:'缺少 email 或 code' });
    }
    const user = await User.findOne({ where:{ email } });
    if(!user) {
      return res.status(404).json({ error:'使用者不存在' });
    }
    if(user.isEmailVerified) {
      return res.json({ message:'此帳號已驗證過，請直接登入' });
    }
    if(user.emailVerifyCode !== code){
      return res.status(400).json({ error:'驗證碼不正確' });
    }
    // 驗證成功
    user.isEmailVerified = true;
    user.emailVerifyCode = null; // 清除驗證碼
    await user.save();

    return res.json({ message:'Email 驗證成功，請重新登入' });
  } catch(err){
    console.error('[VerifyEmail Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

// 登入：需檢查 isEmailVerified
router.post('/login', upload.none(), async(req,res)=>{
  try {
    const { email, password } = req.body;
    if(!email || !password) {
      return res.status(400).json({ error:'缺少 email 或 password' });
    }
    const user = await User.findOne({ where:{ email } });
    if(!user){
      return res.status(404).json({ error:'使用者不存在' });
    }
    if(!user.isEmailVerified){
      return res.status(401).json({ error:'Email 尚未驗證，請先驗證再登入' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if(!valid){
      return res.status(401).json({ error:'密碼錯誤' });
    }

    const token = generateToken({ id:user.id, email:user.email });
    return res.json({
      message:'登入成功',
      token,
      plan: user.plan,
      userName: user.userName
    });
  } catch(err){
    console.error('[Login Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

// 登出
router.post('/logout',(req,res)=>{
  return res.json({ message:'已登出' });
});

module.exports = router;
