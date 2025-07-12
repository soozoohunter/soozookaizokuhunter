// express/routes/profile.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
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
    return res.status(401).json({ error:'Token 無效或已過期' });
  }
}

// 綁定/更新 社群或電商平台
router.post('/bindPlatforms', authMiddleware, async(req,res)=>{
  try {
    const userId = req.user.id;
    const { igLink, youtubeLink, tiktokLink, shopeeLink, rutenLink } = req.body;

    const user = await User.findByPk(userId);
    if(!user){
      return res.status(404).json({ error:'使用者不存在' });
    }

    user.igLink = igLink || null;
    user.youtubeLink = youtubeLink || null;
    user.tiktokLink = tiktokLink || null;
    user.shopeeLink = shopeeLink || null;
    user.rutenLink = rutenLink || null;
    await user.save();

    return res.json({
      message:'平台帳號已更新',
      user
    });
  } catch(e){
    console.error('[bindPlatforms Error]', e);
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
