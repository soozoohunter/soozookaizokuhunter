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

router.get('/', auth, (req, res)=>{
  // 您可從 DB 撈 user 資訊, 此處示範
  return res.json({
    email: req.user.email,
    plan: 'BASIC',
    usageVideo: 0,
    usageImage: 0
  });
});

module.exports = router;
