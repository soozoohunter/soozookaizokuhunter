// express/middleware/auth.js (基礎登入驗證)
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_KEY';

module.exports = function auth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader ? authHeader.replace(/^Bearer\s+/, '') : '';

  console.log('Auth Middleware - Token:', token);

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: '未登入' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (e) {
    console.error('Token verification error:', e.message);
    return res.status(401).json({ error: 'Token 無效或已過期' });
  }
};
