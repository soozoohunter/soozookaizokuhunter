const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

// 保留您原本的 user Array 或 DB 操作 (此處示範)
const users = [];

router.post('/register', async(req, res)=>{
  try {
    const { email, password } = req.body;
    if(!email || !password){
      return res.status(400).json({ error:'缺少 email 或 password' });
    }
    const exist = users.find(u=> u.email===email);
    if(exist){
      return res.status(400).json({ error:'Email 已被使用' });
    }
    const hashed = await bcrypt.hash(password,10);
    users.push({ email, password:hashed });
    return res.json({ message:'註冊成功' });
  } catch(e){
    console.error('[Register error]', e);
    res.status(500).json({ error:e.message });
  }
});

router.post('/login', async(req, res)=>{
  try {
    const { email, password } = req.body;
    if(!email || !password){
      return res.status(400).json({ error:'缺少 email/password' });
    }
    const user = users.find(u=> u.email===email);
    if(!user){
      return res.status(404).json({ error:'使用者不存在' });
    }
    const match = await bcrypt.compare(password, user.password);
    if(!match){
      return res.status(401).json({ error:'密碼錯誤' });
    }
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn:'2h' });
    return res.json({ message:'登入成功', token });
  } catch(e){
    console.error('[Login error]', e);
    res.status(500).json({ error:e.message });
  }
});

module.exports = router;
