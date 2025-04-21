require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { File, User } = require('../models');
const chain = require('../utils/chain');
const { uploadToIPFS } = require('../services/ipfsService');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';
const upload = multer({ dest: 'uploads/' });

// JWT 驗證中介
function authMiddleware(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s*/, '');
    if (!token) throw new Error('缺少 Token');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch(e){
    return res.status(401).json({ error:e.message });
  }
}

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ error:'用戶不存在' });
    if (!req.file) return res.status(400).json({ error:'沒有上傳任何檔案' });

    // 讀取檔案 => 指紋
    const buffer = fs.readFileSync(req.file.path);
    const fingerprint = crypto.createHash('sha256').update(buffer).digest('hex');

    let ipfsHash = null;
    let txHash = null;

    // IPFS 上傳
    try {
      ipfsHash = await uploadToIPFS(buffer);
    } catch(ipfsErr) {
      console.error('[IPFS Error]', ipfsErr);
    }

    // 區塊鏈 storeRecord
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt.transactionHash;
    } catch(chainErr){
      console.error('[storeRecord Error]', chainErr);
    }

    // 寫入 DB
    const newFile = await File.create({
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash,
      user_id: user.id
    });

    // 更新用戶上傳次數
    if (req.file.mimetype.startsWith('video/')) {
      user.uploadVideos++;
    } else {
      user.uploadImages++;
    }
    await user.save();

    // 刪除暫存檔
    fs.unlinkSync(req.file.path);

    return res.json({
      message:'上傳成功',
      fileId:newFile.id,
      fingerprint,
      ipfsHash,
      txHash
    });
  } catch(e){
    console.error('[Upload Error]', e);
    return res.status(500).json({ error:e.message });
  }
});

module.exports = router;
