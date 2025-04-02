const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto-js');
const { uploadToIPFS } = require('../utils/ipfs');
const { writeUserAssetToChain } = require('../utils/chain');

const upload = multer({ dest: 'uploads/' });

// 簡易 auth 中介層
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未授權，缺少Token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, userType }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token無效' });
  }
}

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    // 1. 上傳檔案至 IPFS，取得 ipfsHash
    const ipfsHash = await uploadToIPFS(req.file.path);

    // 2. 生成簡易「DNA特徵碼」
    const DNAHash = crypto.SHA256(ipfsHash).toString();

    // 3. 透過以太坊私有鏈將 (email, DNAHash, fileType, timestamp) 寫入
    const fileType = req.file.mimetype;
    const userEmail = req.user.email;
    const timestamp = Date.now().toString();

    const txHash = await writeUserAssetToChain(userEmail, DNAHash, fileType, timestamp);

    res.json({
      message: '檔案上傳成功',
      ipfsHash,
      DNAHash,
      chainTx: txHash
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
