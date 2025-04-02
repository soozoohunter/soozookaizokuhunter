require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const PlatformAccount = require('../models/PlatformAccount');
const User = require('../models/User');

const { JWT_SECRET } = process.env;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// 新增平台帳號
router.post('/add', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登入' });
  const dec = verifyToken(token);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  const { platformName, accountId } = req.body;
  if (!platformName || !accountId) {
    return res.status(400).json({ error: '缺 platformName / accountId' });
  }

  const user = await User.findByPk(dec.userId);
  if (!user) {
    return res.status(404).json({ error: '找不到用戶' });
  }

  const newAcc = await PlatformAccount.create({
    userId: user.id,
    platformName,
    accountId
  });
  res.json({ message: '平台帳號新增成功', platformAccount: newAcc });
});

// 列出
router.get('/list', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登入' });
  const dec = verifyToken(token);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  const accounts = await PlatformAccount.findAll({
    where: { userId: dec.userId }
  });
  res.json(accounts);
});

module.exports = router;
