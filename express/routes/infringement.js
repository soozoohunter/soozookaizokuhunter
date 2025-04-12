const express = require('express');
const router = express.Router();
const Infringement = require('../models/Infringement');
const jwt = require('jsonwebtoken');
const { writeToBlockchain } = require('../utils/chain');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function authMiddleware(req, res, next){
  const token = (req.headers.authorization||'').replace(/^Bearer\s+/,'');
  if(!token) return res.status(401).json({ error:'未授權' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e){
    return res.status(401).json({ error:'Token無效' });
  }
}

// 新增侵權
router.post('/report', authMiddleware, async (req,res)=>{
  const { workId, description } = req.body;
  if(!description){
    return res.status(400).json({ error:'缺少描述' });
  }
  try {
    const infr = await Infringement.create({ description });

    // 上鏈
    const chainData = `INFRINGE:${req.user.email}|DESC:${description}`;
    const txHash = await writeToBlockchain(chainData);

    infr.chainRef = txHash;
    await infr.save();

    res.json({ message:'已記錄侵權', chainRef:txHash });
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

// 查詢所有
router.get('/', async (req, res)=>{
  try {
    const list = await Infringement.findAll();
    res.json(list);
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

module.exports = router;
