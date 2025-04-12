require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const PlatformAccount = require('../models/PlatformAccount');
const User = require('../models/User');
const { writeToBlockchain } = require('../utils/chain');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function verifyToken(req, res, next){
  try {
    const token = (req.headers.authorization||'').replace(/^Bearer\s+/,'');
    if(!token) return res.status(401).json({ error:'No token' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e){
    return res.status(401).json({ error:'Token invalid' });
  }
}

// GET /profiles/myInfo
router.get('/myInfo', verifyToken, async (req, res)=>{
  try {
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'User not found' });
    res.json({
      email:user.email,
      userName:user.userName,
      plan:user.plan,
      userRole:user.userRole,
      uploadVideos:user.uploadVideos,
      uploadImages:user.uploadImages,
      uploadTrademarks:user.uploadTrademarks
    });
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

// PUT /profiles/myInfo (更新)
router.put('/myInfo', verifyToken, async (req, res)=>{
  try {
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'User not found' });

    const { userName, userRole } = req.body;
    if(userName) user.userName=userName;
    if(userRole) user.userRole=userRole;  // 須檢查是否 COPYRIGHT/TRADEMARK/BOTH

    await user.save();

    const txHash= await writeToBlockchain(`USER:${user.email} UPDATED`);
    res.json({ message:'更新成功並上鏈', chain:txHash });
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

// 新增 /profiles/addPlatform
router.post('/addPlatform', verifyToken, async (req, res)=>{
  try {
    const { platform, accountId } = req.body;
    if(!platform || !accountId) return res.status(400).json({ error:'platform/accountId不可空' });
    await PlatformAccount.create({
      userId:req.user.id,
      platform,
      accountId
    });
    res.json({ message:'平台帳號已新增' });
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

// GET /profiles/myPlatforms
router.get('/myPlatforms', verifyToken, async (req, res)=>{
  try {
    const list = await PlatformAccount.findAll({ where:{ userId:req.user.id }});
    res.json(list);
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

module.exports = router;
