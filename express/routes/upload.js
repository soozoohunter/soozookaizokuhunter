require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Work = require('../models/Work');
const { uploadToIPFS } = require('../utils/ipfs');
const { storeHashOnChain } = require('../utils/chain');

const upload = multer({ storage: multer.memoryStorage() });
const { JWT_SECRET } = process.env;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '缺少token' });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'token無效' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '缺少檔案' });
    }

    // 產生檔案指紋 (SHA256)
    const fileBuffer = req.file.buffer;
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 上傳到 IPFS，取得 ipfsHash
    const ipfsHash = await uploadToIPFS(fileBuffer);

    // 上鏈 (contract.storeFileHash)
    const txHash = await storeHashOnChain(ipfsHash); 

    // 寫入 DB (works)
    const newWork = await Work.create({
      title: req.body.title || '未命名作品',
      fingerprint: hash,
      fileType: req.file.mimetype,
      userId: decoded.userId,
      chainRef: txHash // or 也可存 ipfsHash
    });

    res.json({
      message: '上傳成功',
      workId: newWork.id,
      fingerprint: hash,
      ipfsHash,
      chainRef: txHash
    });
  } catch (err) {
    console.error('上傳失敗:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
