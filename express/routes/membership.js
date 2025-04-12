// express/routes/membership.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

function auth(req, res, next){
  try {
    const token = (req.headers.authorization||'').replace(/^Bearer\s+/,'');
    if(!token) return res.status(401).json({ error:'未登入' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e){
    return res.status(401).json({ error:'token失效' });
  }
}

// GET /membership => 取用戶plan
router.get('/', auth, async(req,res)=>{
  try {
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'用戶不存在' });
    return res.json({
      email: user.email,
      userName: user.userName,
      userRole: user.userRole,
      plan: user.plan,
      uploadVideos: user.uploadVideos,
      uploadImages: user.uploadImages,
      uploadTrademarks: user.uploadTrademarks
    });
  } catch(e){
    return res.status(500).json({ error:e.message });
  }
});

// POST /membership/upgrade => 升級
router.post('/upgrade', auth, async(req,res)=>{
  try {
    const { plan } = req.body; // "PRO" or "ENTERPRISE"
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'用戶不存在' });

    if(!['BASIC','PRO','ENTERPRISE'].includes(plan)){
      return res.status(400).json({ error:'不支援方案' });
    }
    user.plan = plan;
    await user.save();
    return res.json({ message:'升級成功', plan:user.plan });
  } catch(e){
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
