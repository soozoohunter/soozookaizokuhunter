/********************************************************************
 * middleware/authMiddleware.js
 * 檢查 JWT
 ********************************************************************/
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

module.exports = function(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: '缺少授權 token' });
  }
  const token = authHeader.replace(/^Bearer\s+/, '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;  // { userId, plan }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'token 驗證失敗' });
  }
};
