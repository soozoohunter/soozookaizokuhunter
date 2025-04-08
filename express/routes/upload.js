// express/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto-js');
const { uploadToIPFS } = require('../utils/ipfs');
const { writeUserAssetToChain } = require('../utils/chain');

const upload = multer({ dest: 'uploads/' });

// Auth中介層
function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if(!token) return res.status(401).json({ error: '未授權，缺少Token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token無效' });
  }
}

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    // 1) 上傳檔案到 IPFS
    const ipfsHash = await uploadToIPFS(req.file.path);

    // 2) 生成DNA雜湊
    const DNAHash = crypto.SHA256(ipfsHash).toString();

    // 3) 上鏈
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
