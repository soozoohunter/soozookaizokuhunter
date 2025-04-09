// express/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { writeToBlockchain } = require('../utils/chain');

// 載入 JWT (驗證用)
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// ====== 簡易 JWT auth middleware ======
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '');
    if (!token) {
      return res.status(401).json({ error: '尚未登入或缺少 Token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // ex: { id, email, iat, exp }
    next();
  } catch (err) {
    console.error('[authMiddleware] 驗證失敗:', err);
    return res.status(401).json({ error: 'Token 無效或已過期' });
  }
}

// 使用 multer 暫存上傳檔案
const upload = multer({
  dest: '/tmp'  // 上傳檔案暫存目錄
});

// POST /api/upload
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    // 1) 是否有檔案
    if (!req.file) {
      return res.status(400).json({ error: '尚未選擇檔案' });
    }

    // 2) 從 token 解析出使用者 email
    const userEmail = req.user.email || 'unknown';

    // 3) 讀取檔案並計算 MD5 (或 SHA256) 指紋
    const filePath = req.file.path; // /tmp/xxxx
    const fileBuffer = fs.readFileSync(filePath);
    const fingerprint = crypto
      .createHash('md5')
      .update(fileBuffer)
      .digest('hex');

    // 4) (可選) 上傳 IPFS 或存 DB，此處僅示範 fingerprint
    // 5) 同步上鏈
    try {
      const txHash = await writeToBlockchain(`${userEmail}|${fingerprint}`);
      console.log('[Upload] fingerprint 上鏈成功 =>', txHash);
    } catch (chainErr) {
      console.error('[Upload] 上鏈失敗:', chainErr);
      // 若要 rollback or 記錄, 視需求另行處理
    }

    // 6) 刪除 multer 暫存檔
    fs.unlinkSync(filePath);

    // 7) 回傳結果
    res.json({
      message: '上傳成功',
      fileName: req.file.originalname,
      fingerprint
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
