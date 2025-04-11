// express/routes/upload.js

require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { writeToBlockchain } = require('../utils/chain'); // 若要上鏈

// 讀取 JWT 秘鑰
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// ============ JWT 驗證中介層 (如您需要保護上傳功能) ============
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '');
    if (!token) {
      return res.status(401).json({ error: '尚未登入或缺少 Token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    // req.user = { id, email, ... }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[authMiddleware] 驗證失敗:', err);
    return res.status(401).json({ error: 'Token 無效或已過期' });
  }
}

// ============ Multer 設定 ============
// 您可改 dest:'uploads' or /tmp
const upload = multer({ dest: 'uploads/' });

// ============ 上傳路由 ============
// POST /api/upload
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error:'尚未選擇檔案' });
    }
    const userEmail = req.user.email || 'unknown@example.com';

    // 讀取檔案
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);

    // 建立檔案 md5 指紋 (可改用 sha256)
    const fingerprint = crypto
      .createHash('md5')
      .update(buffer)
      .digest('hex');

    // (可選) 上鏈
    try {
      const txHash = await writeToBlockchain(`${userEmail}|${fingerprint}`);
      console.log('[Upload] fingerprint上鏈成功:', txHash);
    } catch(chainErr) {
      console.error('[Upload] 上鏈失敗:', chainErr);
    }

    // 刪除本機暫存檔
    fs.unlinkSync(filePath);

    // 回傳結果
    return res.json({
      message:'上傳成功',
      fileName: req.file.originalname,
      fingerprint
    });

  } catch (err) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
