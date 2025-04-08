// express/routes/infringement.js
const express = require('express');
const router = express.Router();
const Infringement = require('../models/Infringement');
const jwt = require('jsonwebtoken');
const { writeInfringementToChain } = require('../utils/chain');

// auth 中介層
function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未授權，缺少Token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token無效' });
  }
}

// 新增侵權記錄 + 上鏈
router.post('/report', authMiddleware, async (req, res) => {
  const { workId, description } = req.body;
  try {
    const infringement = await Infringement.create({ workId, description });

    // 上鏈
    const userEmail = req.user.email;
    const infrInfo = `Infr:${description}`;
    const timestamp = Date.now().toString();
    const txHash = await writeInfringementToChain(userEmail, infrInfo, timestamp);

    res.json({ message: '侵權記錄已新增', infringement, chainTx: txHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 獲取所有侵權記錄
router.get('/', async (req, res) => {
  try {
    const infringements = await Infringement.findAll();
    res.json(infringements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
