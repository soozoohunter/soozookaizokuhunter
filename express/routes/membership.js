// express/routes/membership.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// JWT 驗證中介層
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '');
    if (!token) {
      return res.status(401).json({ error: '尚未登入或缺少 Token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[authMiddleware] 驗證失敗:', err);
    return res.status(401).json({ error: 'Token 無效或已過期' });
  }
}

// GET /api/membership -> 顯示當前會員資訊
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }
    return res.json({
      email: user.email,
      userName: user.userName,
      plan: user.plan,
      uploadVideos: user.uploadVideos,
      uploadImages: user.uploadImages,
      message: `您目前是【${user.plan}】方案`
    });
  } catch(err) {
    console.error('[Membership GET Error]', err);
    return res.status(500).json({ error:err.message });
  }
});

// POST /api/membership/upgrade -> 升級會員 (範例：BASIC -> PRO)
router.post('/upgrade', authMiddleware, async (req,res)=>{
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if(!user) {
      return res.status(404).json({ error:'使用者不存在' });
    }
    // 依需求：若已是 ENTERPRISE 就不用升級
    user.plan = 'PRO';
    await user.save();

    return res.json({
      message:'已升級為 PRO 方案',
      plan: user.plan
    });
  } catch(err){
    console.error('[Membership Upgrade Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
