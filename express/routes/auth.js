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

// 假示範: nodemailer
async function sendVerificationEmail(toEmail, code){
  console.log(`(偽) 寄送驗證信到 ${toEmail}，驗證碼: ${code}`);
}

router.post('/register', upload.none(), async(req,res)=>{
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

    if(!email || !password || !userName) {
      return res.status(400).json({ error:'缺少必填欄位 (email, password, userName)' });
    }
    const exist = await User.findOne({ where:{ email } });
    if(exist) {
      return res.status(400).json({ error:'此 Email 已被註冊' });
    }
    const hashed = await bcrypt.hash(password,10);
    const code = crypto.randomInt(100000, 999999).toString();

    const newUser = await User.create({
      email,
      password: hashed,
      userName,
      plan:'BASIC',
      isEmailVerified:false,
      emailVerifyCode: code,

      // 如果model有這些欄位
      facebook, instagram, youtube, tiktok,
      shopee, ruten, amazon, taobao
    });

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

    user.isEmailVerified = true;
    user.emailVerifyCode = null; 
    await user.save();

    return res.json({ message:'Email 驗證成功，請重新登入' });
  } catch(err){
    console.error('[VerifyEmail Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

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

router.post('/logout',(req,res)=>{
  return res.json({ message:'已登出' });
});

module.exports = router;
