// express/routes/membership.js

require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// 驗證中介層
function authMiddleware(req, res, next){
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/,'');
    if(!token) {
      return res.status(401).json({ error:'未登入' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch(e){
    console.error('[authMiddleware] Error', e);
    return res.status(401).json({ error:'Token無效或已過期' });
  }
}

// GET /api/membership => 查看會員資料
router.get('/', authMiddleware, async(req,res)=>{
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if(!user) {
      return res.status(404).json({ error:'使用者不存在' });
    }
    return res.json({
      email: user.email,
      userName: user.userName,
      userRole: user.userRole,
      plan: user.plan,
      uploadVideos: user.uploadVideos,
      uploadImages: user.uploadImages
    });
  } catch(e){
    console.error('[Membership GET]', e);
    return res.status(500).json({ error:e.message });
  }
});

// POST /api/membership/upgrade => 升級成 PRO
router.post('/upgrade', authMiddleware, async(req,res)=>{
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if(!user){
      return res.status(404).json({ error:'使用者不存在' });
    }
    // 升級到 PRO (示例)
    user.plan = 'PRO';
    await user.save();

    return res.json({
      message:'已升級為 PRO 方案',
      plan: user.plan
    });
  } catch(e){
    console.error('[Membership Upgrade]', e);
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
