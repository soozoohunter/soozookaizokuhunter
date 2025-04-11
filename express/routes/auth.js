// express/routes/auth.js

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn:'1h' });
}

// 註冊
router.post('/register', upload.single('trademarkLogo'), async(req,res)=>{
  try {
    const { email, password, userName, userRole } = req.body;
    if(!email || !password || !userName || !userRole) {
      return res.status(400).json({ error:'缺少必填欄位 (email,password,userName,userRole)' });
    }
    const exist = await User.findOne({ where:{ email } });
    if(exist) {
      return res.status(400).json({ error:'此 Email 已被註冊' });
    }
    const hashed = await bcrypt.hash(password,10);
    const newUser = await User.create({
      email,
      password: hashed,
      userName,
      userRole
      // plan = BASIC
      // uploadVideos=0, uploadImages=0
    });
    return res.json({
      message:'註冊成功',
      userId: newUser.id,
      email: newUser.email,
      userRole: newUser.userRole,
      plan: newUser.plan
    });
  } catch(err){
    console.error('[Register Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

// 登入
router.post('/login', async(req,res)=>{
  try {
    const { email, password } = req.body;
    if(!email || !password) {
      return res.status(400).json({ error:'缺少 email 或 password' });
    }
    const user = await User.findOne({ where:{ email } });
    if(!user){
      return res.status(404).json({ error:'使用者不存在' });
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
