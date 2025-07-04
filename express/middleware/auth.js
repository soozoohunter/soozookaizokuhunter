// express/middleware/auth.js (基礎登入驗證)
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_KEY';

module.exports = function auth(req, res, next) {
  // 1. 從 HTTP header 取出 Authorization Token
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: '未提供身份驗證 Token' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    return res.status(401).json({ message: 'Token 格式錯誤' });
  }

  try {
    // 2. 驗證 JWT 是否有效
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3. 將解碼後的使用者資訊附加到 request 物件上，以便後續路由使用
    req.user = decoded; 
    
    // 4. 通過驗證，繼續執行下一個中介層或路由處理器
    next();
  } catch (err) {
    console.error('[Auth Middleware] Token 驗證失敗：', err);
    return res.status(401).json({ message: '身份驗證失敗：無效的 Token' });
  }
};
