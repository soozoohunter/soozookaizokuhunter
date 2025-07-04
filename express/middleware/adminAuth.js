// express/middleware/adminAuth.js (管理員權限驗證)
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_KEY';

module.exports = function adminAuth(req, res, next) {
    // 基礎的 Token 驗證邏輯
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return res.status(401).json({ message: '未提供身份驗證 Token' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return res.status(401).json({ message: 'Token 格式錯誤' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        // [核心差異] 在驗證 Token 後，額外檢查管理員權限
        const userRole = decoded.role;
        const isAdmin = (userRole === 'admin');

        if (!isAdmin) {
            return res.status(403).json({ message: '禁止存取：此操作需要管理員權限' });
        }

        // 權限足夠，繼續
        next();
    } catch (err) {
        console.error('[Admin Auth Middleware] Token 驗證失敗：', err);
        return res.status(401).json({ message: '身份驗證失敗：無效的 Token' });
    }
};
