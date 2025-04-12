// express/routes/membership.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

function auth(req, res, next){
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '');
  if(!token) return res.status(401).json({ error:'未登入' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e){
    return res.status(403).json({ error:'token失效' });
  }
}

// GET /membership => 回傳當前用戶方案
router.get('/', auth, (req, res)=>{
  // (此處僅示範, 生產應查 DB)
  return res.json({
    email: req.user.email,
    plan: 'BASIC',
    usageVideo: 0,
    usageImage: 0
  });
});

module.exports = router;
