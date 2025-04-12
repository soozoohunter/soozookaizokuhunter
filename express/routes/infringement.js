// express/routes/infringement.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Infringement = require('../models/Infringement');
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

// 新增報告
router.post('/report', auth, async(req,res)=>{
  try {
    const { description } = req.body;
    if(!description) return res.status(400).json({ error:'缺少 description' });
    const inf = await Infringement.create({ description });
    const chainData = `User:${req.user.email}|desc=${description}`;
    const txHash = await writeToBlockchain(chainData);
    inf.chainRef = txHash;
    await inf.save();
    return res.json({ message:'侵權已紀錄', infringement:inf, chainTx:txHash });
  } catch(e){
    return res.status(500).json({ error:e.message });
  }
});

// 取得全部
router.get('/', async(req,res)=>{
  try {
    const list = await Infringement.findAll();
    return res.json(list);
  } catch(e){
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
