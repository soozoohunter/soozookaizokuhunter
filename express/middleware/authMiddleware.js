// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']; 
  if (!authHeader) {
    return res.status(401).json({ message: '未提供授權 token' });
  }
  const token = authHeader.split(' ')[1];  // 假設格式: "Bearer <token>"
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // 將 JWT payload 資訊附加到請求物件上供後續使用
    req.user = payload;  // 包含 userId, plan 等資訊
    next();
  } catch (err) {
    return res.status(401).json({ message: '授權 token 無效' });
  }
}

module.exports = authMiddleware;
