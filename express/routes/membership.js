// express/routes/membership.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

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
    return res.status(401).json({ error:'Token 無效或已過期' });
  }
}

// GET /membership => 查看會員資料
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
      plan: user.plan,
      uploadVideos: user.uploadVideos,
      uploadImages: user.uploadImages,
      isEmailVerified: user.isEmailVerified,
      igLink: user.igLink,
      youtubeLink: user.youtubeLink,
      tiktokLink: user.tiktokLink,
      shopeeLink: user.shopeeLink,
      rutenLink: user.rutenLink
    });
  } catch(e){
    console.error('[Membership GET]', e);
    return res.status(500).json({ error:e.message });
  }
});

// POST /membership/upgrade => 升級 (傳入 targetPlan=PRO or ENTERPRISE)
router.post('/upgrade', authMiddleware, async(req,res)=>{
  try {
    const userId = req.user.id;
    const { targetPlan } = req.body; // e.g. PRO / ENTERPRISE
    if(!targetPlan) {
      return res.status(400).json({ error:'缺少 targetPlan' });
    }
    if(!['PRO','ENTERPRISE'].includes(targetPlan)){
      return res.status(400).json({ error:'無效的方案' });
    }

    const user = await User.findByPk(userId);
    if(!user){
      return res.status(404).json({ error:'使用者不存在' });
    }
    user.plan = targetPlan;
    await user.save();

    return res.json({
      message:'已升級為 '+ targetPlan +' 方案',
      plan: user.plan
    });
  } catch(e){
    console.error('[Membership Upgrade]', e);
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
