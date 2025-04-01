require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { DataTypes } = require('sequelize');

const User = db.define('User',{
  email:{ type: DataTypes.STRING, unique:true },
  passwordHash: DataTypes.STRING,
  role:{ type: DataTypes.ENUM('shortVideo','ecommerce'), defaultValue:'shortVideo'}
},{ tableName:'users' });

router.post('/signup', async(req,res)=>{
  try{
    const { email, password, role } = req.body;
    if(!email||!password) return res.status(400).json({error:'缺 email/password'});
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    let newUser = await User.create({
      email,
      passwordHash: hash,
      role: role || 'shortVideo'
    });
    res.status(201).json({ userId:newUser.id, role:newUser.role });
  } catch(e){
    console.error('signup fail:', e.message);
    res.status(400).json({error:e.message||'註冊失敗'});
  }
});

router.post('/login', async(req,res)=>{
  try{
    const { email, password } = req.body;
    if(!email||!password) return res.status(400).json({error:'缺 email/password'});
    let user = await User.findOne({ where:{email} });
    if(!user) return res.status(401).json({error:'無此用戶'});
    let match = await bcrypt.compare(password, user.passwordHash);
    if(!match) return res.status(401).json({error:'密碼錯誤'});

    let token = jwt.sign({ userId:user.id, role:user.role }, process.env.JWT_SECRET, { expiresIn:'2h' });
    res.json({ message:'登入成功', token, role:user.role });
  }catch(e){
    console.error(e.message);
    res.status(500).json({error:'伺服器錯誤'});
  }
});

module.exports = router;
