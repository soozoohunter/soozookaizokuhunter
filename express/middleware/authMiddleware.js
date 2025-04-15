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
    // 3. 驗證 JWT，若過期或簽名不符，會拋出錯誤進入 catch
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. 檢查使用者是否具備管理員資格
    const userEmail = decoded.email;
    const userRole = decoded.role;
    // 符合下列兩種情況之一即可：
    // (A) role=admin  (B) email in [ 'jeffqqm@gmail.com', 'zacyao88@icloud.com' ]
    const isAdmin = (userRole === 'admin');
    const isAllowedEmail =
      userEmail === 'jeffqqm@gmail.com' ||
      userEmail === 'zacyao88@icloud.com';

    if (!isAdmin && !isAllowedEmail) {
      return res.status(403).json({ message: '禁止存取：您的帳號無權限執行此操作' }); // 403
    }

    // 通過驗證與權限檢查
    req.user = decoded; // 可以在後續路由取得 req.user
    next();
  } catch (err) {
    // JWT 驗證失敗或過期
    console.error('[authMiddleware] 驗證失敗：', err);
    return res.status(401).json({ message: '身份驗證失敗：無效的 Token' });
  }
};
