/********************************************************************
 * middleware/authMiddleware.js
 * 檢查 JWT + 管理員權限 (role=admin or allowed email)
 ********************************************************************/
const jwt = require('jsonwebtoken');

// 建議在 .env 中設定 JWT_SECRET；若無則使用此預設字串
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_KEY';

module.exports = function authMiddleware(req, res, next) {
  // 1. 從 HTTP header 取出 Authorization (JWT)
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: '未提供身份驗證 Token' }); // 401 未授權
  }

  // 2. 解析出 token (格式: Bearer <token>)
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    return res.status(401).json({ message: 'Token 格式錯誤' }); // 401
  }

  try {
    // 3. 驗證 JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. 檢查使用者是否具備管理員資格 (可選)
    const userEmail = decoded.email;
    const userRole = decoded.role;
    const isAdmin = (userRole === 'admin');
    const isAllowedEmail =
      userEmail === 'jeffqqm@gmail.com' ||
      userEmail === 'zacyao88@icloud.com';

    if (!isAdmin && !isAllowedEmail) {
      return res.status(403).json({ message: '禁止存取：您的帳號無權限執行此操作' }); // 403
    }

    // 通過
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[authMiddleware] 驗證失敗：', err);
    return res.status(401).json({ message: '身份驗證失敗：無效的 Token' });
  }
};
