// express/routes/profiles.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const PlatformAccount = require('../models/PlatformAccount');
const { writeToBlockchain } = require('../utils/chain');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function verifyToken(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error:'未登入(無token)' });
  const token = auth.replace('Bearer ','');
  try {
    const dec = jwt.verify(token, JWT_SECRET);
    req.user = dec; // { id, email, iat, exp }
    next();
  } catch(e){
    return res.status(401).json({ error:'token失效或不正確' });
  }
}

// ================ 會員中心: 取得/更新 userInfo ================

// [GET] /profiles/myInfo
router.get('/myInfo', verifyToken, async(req, res)=>{
  try {
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'用戶不存在' });
    return res.json({
      email: user.email,
      userName: user.userName,
      userRole: user.userRole,
      platforms: user.platforms
    });
  } catch(e){
    console.error('GET /myInfo error:', e);
    return res.status(500).json({ error: e.message });
  }
});

// [PUT] /profiles/myInfo
// 可更新 userName, userRole, platforms → 同時寫入鏈上
router.put('/myInfo', verifyToken, express.json(), async(req, res)=>{
  try {
    const { userName, userRole, platforms } = req.body;
    const user = await User.findByPk(req.user.id);
    if(!user) return res.status(404).json({ error:'用戶不存在' });

    if(userName) user.userName = userName;
    if(userRole && ['COPYRIGHT','TRADEMARK','BOTH'].includes(userRole)){
      user.userRole = userRole;
    }
    if(typeof platforms === 'string'){
      user.platforms = platforms;
    }
    await user.save();

    // 將更新後的 userName / userRole / platforms 上鏈 (示範)
    const dataStr = `UPDATE_USER:${user.email}|ROLE:${user.userRole}|NAME:${user.userName}`;
    const txHash = await writeToBlockchain(dataStr);

    return res.json({
      message:'會員資料已更新並已上鏈',
      user:{
        email:user.email,
        userName:user.userName,
        userRole:user.userRole,
        platforms:user.platforms
      },
      txHash
    });
  } catch(e){
    console.error('PUT /myInfo error:', e);
    return res.status(500).json({ error:e.message });
  }
});

// ================ 平台帳號: 新增/列出 ================

// [POST] /profiles/addPlatform
router.post('/addPlatform', verifyToken, express.json(), async(req, res) => {
  try {
    const { platform, accountId } = req.body;
    if(!platform || !accountId){
      return res.status(400).json({ error:'缺 platform 或 accountId' });
    }
    await PlatformAccount.create({
      userId:req.user.id,
      platform,
      accountId
    });
    res.json({ message:'平台帳號已新增' });
  } catch(e){
    console.error('addPlatform error:', e);
    return res.status(500).json({ error:e.message });
  }
});

// [GET] /profiles/myPlatforms
router.get('/myPlatforms', verifyToken, async(req, res)=>{
  try {
    const list = await PlatformAccount.findAll({ where:{ userId:req.user.id } });
    res.json(list);
  } catch(e){
    console.error('myPlatforms error:', e);
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
