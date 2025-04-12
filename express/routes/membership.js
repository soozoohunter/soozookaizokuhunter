require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function authMiddleware(req, res, next){
  try {
    const token = (req.headers.authorization||'').replace(/^Bearer\s+/,'');
    if(!token) return res.status(401).json({ error:'未登入' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch(e){
    console.error('[authMiddleware]', e);
    return res.status(401).json({ error:'Token無效或過期' });
  }
}

// ================ 查看會員資料 ================
router.get('/', authMiddleware, async (req, res)=>{
  try {
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'找不到使用者' });
    return res.json({
      email:user.email,
      userName:user.userName,
      userRole:user.userRole,
      plan:user.plan,
      uploadVideos:user.uploadVideos,
      uploadImages:user.uploadImages,
      uploadTrademarks:user.uploadTrademarks
    });
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

// ================ 升級 方案 ================
router.post('/upgrade', authMiddleware, async(req,res)=>{
  try {
    const { plan } = req.body;  // e.g. { plan:'PRO' }
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'找不到使用者' });

    const newPlan = plan || 'PRO';
    user.plan = newPlan;
    await user.save();

    return res.json({
      message:`已升級為 ${user.plan}`,
      plan:user.plan
    });
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

module.exports = router;
