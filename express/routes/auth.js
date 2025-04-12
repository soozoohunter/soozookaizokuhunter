const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const User = require('../models/User');
require('dotenv').config();

const upload = multer({ dest:'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn:'2h' });
}

// ================ 先寄驗證碼 (可自行改為手機簡訊或 Email) ================
router.post('/send-code', async (req, res)=>{
  try {
    const { email } = req.body;
    if(!email) return res.status(400).json({ error:'缺少 email' });

    // 生成 6 碼驗證碼
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[send-code] to ${email}, code=${code}`);

    // DB 記錄
    let user = await User.findOne({ where: { email } });
    if(!user){
      user = await User.create({
        email,
        password:'temp',
        userName:'tempName',
        verificationCode:code,
        emailVerified:false
      });
    } else {
      user.verificationCode = code;
      user.emailVerified = false;
      await user.save();
    }

    // TODO: 寄 Email or SMS
    return res.json({ message:'已產生驗證碼', code });
  } catch(e){
    console.error('[send-code]', e);
    res.status(500).json({ error:e.message });
  }
});

// ================ 註冊 (帶 verificationCode) ================
router.post('/register', upload.none(), async (req, res)=>{
  try {
    const { email, password, userName, userRole, verificationCode } = req.body;
    if(!email || !password || !userName || !userRole){
      return res.status(400).json({ error:'缺少必填欄位' });
    }

    let user = await User.findOne({ where: { email } });
    if(!user){
      return res.status(400).json({ error:'請先 send-code，無此 email' });
    }

    if(user.verificationCode !== verificationCode){
      return res.status(400).json({ error:'驗證碼錯誤' });
    }

    const hashed = await bcrypt.hash(password,10);
    user.password = hashed;
    user.userName = userName;
    user.userRole = userRole;
    user.verificationCode = null;
    user.emailVerified = true;
    user.plan = 'BASIC';
    await user.save();

    const token = generateToken({ id:user.id, email:user.email });

    return res.json({
      message:'註冊成功',
      email:user.email,
      userName:user.userName,
      plan:user.plan,
      token
    });
  } catch(e){
    console.error('[Register]', e);
    res.status(500).json({ error:e.message });
  }
});

// ================ 登入 ================
router.post('/login', async (req, res)=>{
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ error:'缺少 email/password' });

    const user = await User.findOne({ where:{ email } });
    if(!user) return res.status(404).json({ error:'用戶不存在' });

    const isValid = await bcrypt.compare(password, user.password);
    if(!isValid) return res.status(401).json({ error:'密碼錯誤' });

    const token = generateToken({ id:user.id, email:user.email });
    return res.json({
      message:'登入成功',
      token,
      plan:user.plan,
      userName:user.userName
    });
  } catch(e){
    console.error('[Login]', e);
    res.status(500).json({ error:e.message });
  }
});

// ================ 登出 ================
router.post('/logout',(req, res)=>{
  return res.json({ message:'已登出, Token請自行在前端清除' });
});

module.exports = router;
