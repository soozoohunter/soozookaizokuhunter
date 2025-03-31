// express/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const upload = multer({ dest: 'uploads/' });

const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];

// 速率限制器 (範例: 15分鐘內最多 10 次)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: '上傳次數過多，請稍後再試'
});

// JWT 驗證中介層
function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '需要授權(缺少 token)' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: '無效憑證或已過期' });
  }
}

// 上傳介面
router.post('/upload', authMiddleware, uploadLimiter, upload.single('file'), (req, res) => {
  // 檔案類型白名單檢查
  if (!allowedTypes.includes(req.file.mimetype)) {
    // 上傳完才知道 mimetype，若不符可直接刪除
    fs.unlinkSync(req.file.path);
    return res.status(415).json({ error: '不支援的文件類型' });
  }

  // 生成 fingerprint (SHA256)
  const fileBuffer = fs.readFileSync(req.file.path);
  const fingerprint = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // 紀錄日誌
  console.log(`[${new Date().toISOString()}] User ${req.user.userId} uploaded ${req.file.originalname}, fingerprint=${fingerprint}`);

  // TODO: 寫入資料庫, 綁定用戶ID
  // e.g. INSERT INTO uploads (user_id, file_name, fingerprint, created_at) VALUES (...)

  return res.json({
    message: '上傳成功',
    filename: req.file.originalname,
    fingerprint
  });
});

// 讓 express server.js import 時可以掛載此路由
module.exports = router;
