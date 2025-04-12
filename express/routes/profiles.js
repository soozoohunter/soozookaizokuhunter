// express/routes/profiles.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PlatformAccount = require('../models/PlatformAccount');
const { writeToBlockchain } = require('../utils/chain');
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

// GET /profiles/myInfo => user info
router.get('/myInfo', auth, async(req, res)=>{
  try {
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'不存在' });
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

// PUT /profiles/myInfo => 修改 userName / userRole
router.put('/myInfo', auth, async(req,res)=>{
  try {
    const { userName, userRole } = req.body;
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'不存在' });

    if(userName) user.userName = userName;
    if(userRole && ['COPYRIGHT','TRADEMARK','BOTH'].includes(userRole)){
      user.userRole = userRole;
    }
    await user.save();

    const chainData = `UPDATE:${user.email}|role=${user.userRole}|name=${user.userName}`;
    const txHash = await writeToBlockchain(chainData);

    return res.json({ message:'已更新', user, txHash });
  } catch(e){
    return res.status(500).json({ error:e.message });
  }
});

// POST /profiles/addPlatform => 新增平台帳號
router.post('/addPlatform', auth, async(req, res)=>{
  try {
    const { platform, accountId } = req.body;
    if(!platform || !accountId) return res.status(400).json({ error:'缺 platform/accountId' });
    await PlatformAccount.create({
      userId: req.user.id,
      platform,
      accountId
    });
    return res.json({ message:'平台帳號已新增' });
  } catch(e){
    return res.status(500).json({ error:e.message });
  }
});

// GET /profiles/myPlatforms => 查自己
router.get('/myPlatforms', auth, async(req, res)=>{
  try {
    const list = await PlatformAccount.findAll({ where:{ userId:req.user.id } });
    return res.json(list);
  } catch(e){
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
