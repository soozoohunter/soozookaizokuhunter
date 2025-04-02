require('dotenv').config();
const express = require('express');
const router = express.Router();
const Infringement = require('../models/Infringement');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

// token 驗證
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// 新增侵權記錄
router.post('/report', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登入' });
  const dec = verifyToken(token);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  try {
    const { workId, infringingUrl, demandedPrice } = req.body;
    if (!workId || !infringingUrl) {
      return res.status(400).json({ error: '缺 workId / infringingUrl' });
    }

    const newInfr = await Infringement.create({
      workId,
      infringingUrl,
      demandedPrice: demandedPrice || 0
    });
    res.json({ message: '已新增侵權回報', id: newInfr.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 查詢侵權記錄
router.get('/list', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登入' });
  const dec = verifyToken(token);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  try {
    const list = await Infringement.findAll();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
