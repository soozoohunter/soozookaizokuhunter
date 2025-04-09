// express/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 假設您有 chain.js (或 blockchain.js) 的 writeToBlockchain()
const { writeToBlockchain } = require('../utils/chain');

// 若您有 Auth Middleware 來解析 JWT, 取得 user.email:
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

//--- 簡易 auth 中介層 (或您已有)
function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.replace(/^Bearer\s+/, '');
    if (!token) {
      return res.status(401).json({ error: '缺少 Token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // 例如 {id, email}
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token無效' });
  }
}

//--- 1) 用 multer diskStorage (存 /tmp), 也可 memoryStorage
const upload = multer({
  dest: '/tmp' // 上傳暫存目錄
});

//--- 2) POST /upload
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '尚未選擇檔案' });
    }

    // (A) 取得該使用者 email
    const userEmail = req.user.email;  // 來自 authMiddleware

    // (B) 讀取檔案並產生雜湊 (MD5 or SHA256 皆可)
    const filePath = req.file.path;  // e.g. /tmp/xxxxx
    const fileBuffer = fs.readFileSync(filePath);
    const fingerprint = crypto
      .createHash('md5')
      .update(fileBuffer)
      .digest('hex');

    // (C) 如需將檔案上傳 IPFS, 或存 DB, 可在這裡做
    // (D) 寫入區塊鏈
    await writeToBlockchain({ 
      userEmail, 
      fileHash: fingerprint 
    });

    // (E) 刪除暫存檔 (可保留看您需求)
    fs.unlinkSync(filePath);

    // (F) 回傳
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
