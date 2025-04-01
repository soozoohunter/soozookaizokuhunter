require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { DataTypes } = require('sequelize');
const UserModel = require('../models/User')(db, DataTypes);

const { JWT_SECRET, EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

// nodemailer
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

router.post('/signup', async(req,res)=>{
  try{
    const { email, password, role } = req.body;
    if(!email||!password){
      return res.status(400).json({error:'缺 email/password'});
    }
    let exist = await UserModel.findOne({ where:{email} });
    if(exist) return res.status(400).json({error:'Email已被註冊'});
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser=await UserModel.create({
      email,
      password_hash: passwordHash,
      role: role||'shortVideo'
    });
    // 寄送歡迎信
    try{
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject:'歡迎註冊速誅侵權獵人',
        text:'感謝您加入，讓我們一起守護原創！'
      });
    } catch(e){
      console.error('寄信失敗:', e.message);
    }
    res.json({message:'註冊成功', userId:newUser.id, role:newUser.role});
  }catch(e){
    console.error('signup err:', e.message);
    res.status(400).json({error:e.message||'註冊失敗'});
  }
});

router.post('/login', async(req,res)=>{
  try{
    const { email, password } = req.body;
    if(!email||!password) return res.status(400).json({error:'缺 email/password'});
    let user = await UserModel.findOne({ where:{email} });
    if(!user) return res.status(401).json({error:'用戶不存在'});

    let match = await bcrypt.compare(password, user.password_hash);
    if(!match) return res.status(401).json({error:'密碼錯誤'});

    let token = jwt.sign({ userId:user.id, role:user.role }, JWT_SECRET||'KaiKaiShieldSecret', {expiresIn:'2h'});
    res.json({ message:'登入成功', token, role:user.role });
  }catch(e){
    console.error('login err:', e.message);
    res.status(500).json({error:'伺服器錯誤'});
  }
});

// 登出
const revokedTokens=new Set();
router.post('/logout',(req,res)=>{
  const token = req.headers.authorization&&req.headers.authorization.replace('Bearer ','');
  if(!token) return res.status(400).json({error:'缺 token'});
  revokedTokens.add(token);
  res.json({message:'已登出, Token已撤銷'});
});

module.exports = router;
