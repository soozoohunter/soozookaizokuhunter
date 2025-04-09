const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 載入 chain 工具
const { writeToBlockchain } = require('../utils/chain');

// 載入 JWT 驗證
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

/**
 * 簡易 JWT auth middleware
 * - 解析 headers.authorization: "Bearer XXX"
 * - 驗證並把 user 存到 req.user
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '');
    if (!token) {
      return res.status(401).json({ error: '缺少 Token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    // e.g. decoded = { id, email, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token無效' });
  }
}

// 使用 multer 暫存上傳檔案
const upload = multer({
  dest: '/tmp'  // 暫存目錄
});

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '尚未選擇檔案' });
    }

    // 1) 從 token 解析出的使用者 email
    const userEmail = req.user.email || 'unknown';

    // 2) 讀取上傳檔案並計算 MD5 指紋
    const filePath = req.file.path; // /tmp/xxxx
    const fileBuffer = fs.readFileSync(filePath);
    const fingerprint = crypto
      .createHash('md5')
      .update(fileBuffer)
      .digest('hex');

    // 3) (可選) 將檔案存雲端 / IPFS；這裡僅示範 fingerprint
    // 4) 上鏈
    try {
      const txHash = await writeToBlockchain(`${userEmail}|${fingerprint}`);
      console.log('[Upload] 檔案 fingerprint 上鏈成功:', txHash);
    } catch (chainErr) {
      console.error('[Upload] 上鏈失敗:', chainErr);
      // 若要 rollback or 記錄，視需求處理
    }

    // 5) 刪除暫存檔
    fs.unlinkSync(filePath);

    // 6) 回應成功
    res.json({
      message: '上傳成功',
      fileName: req.file.originalname,
      fingerprint
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
