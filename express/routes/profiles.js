// express/routes/profiles.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const PlatformAccount = require('../models/PlatformAccount');

const { JWT_SECRET } = process.env;

function verifyToken(tk) {
  try {
    return jwt.verify(tk, JWT_SECRET || 'KaiKaiShieldSecret');
  } catch(e) {
    return null;
  }
}

// 新增平台帳號
router.post('/addPlatform', async(req, res) => {
  const tk = req.headers.authorization?.replace('Bearer ','');
  if (!tk) return res.status(401).json({ error: '未登入' });
  let dec = verifyToken(tk);
  if (!dec) return res.status(401).json({ error: 'token失效' });

  const { platform, accountId } = req.body;
  if(!platform || !accountId) {
    return res.status(400).json({ error: '缺 platform / accountId' });
  }

  await PlatformAccount.create({
    userId: dec.id,  // or dec.userId, 取決於token內容
    platform,
    accountId
  });
  res.json({ message: '平台帳號已新增' });
});

// 列出所有平台帳號
router.get('/myPlatforms', async(req, res) => {
  const tk = req.headers.authorization?.replace('Bearer ','');
  if (!tk) return res.status(401).json({ error: '未登入' });
  let dec = verifyToken(tk);
  if (!dec) return res.status(401).json({ error: 'token失效' });

  const list = await PlatformAccount.findAll({ where: { userId: dec.id } });
  res.json(list);
});

module.exports = router;
