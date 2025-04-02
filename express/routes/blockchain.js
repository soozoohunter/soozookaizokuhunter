require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { initWeb3, getContract } = require('../utils/chain');

const { JWT_SECRET } = process.env;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

router.get('/checkHash/:hash', async (req, res) => {
  // 假設合約內有 getFileOwner(bytes32 _hash) 之類函式
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登入' });
  const dec = verifyToken(token);
  if (!dec) return res.status(401).json({ error: 'token無效' });

  const { hash } = req.params;
  if (!hash) return res.status(400).json({ error: '缺 hash' });

  try {
    const contract = getContract();
    // 假設合約定義 function getFileOwner(bytes32) returns (address)
    const owner = await contract.methods.getFileOwner(hash).call();
    res.json({ hash, owner });
  } catch (err) {
    console.error('合約呼叫失敗:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
