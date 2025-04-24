/*************************************************************
 * express/routes/protect.js (只示範主要變動)
 *************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { File } = require('../models'); // 用 Sequelize 定義的 File
// const { storeRecord } = require('../utils/chain');  // 區塊鏈

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  }
});
const upload = multer({ storage });

// 上傳作品: POST /api/protect/step1
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    const { realName, phone, address, email } = req.body;
    if (!req.file) {
      return res.status(400).json({ success:false, message:'未上傳檔案' });
    }
    if (!realName || !phone || !address || !email) {
      return res.status(400).json({ success:false, message:'缺少必填欄位' });
    }

    const filePath = path.join(uploadDir, req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const fingerprint = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // ★ 可上鏈 / IPFS
    // const ipfsHash = await uploadToIPFS(fileBuffer);
    // const chainReceipt = await storeRecord(fingerprint, ipfsHash);

    // userId 可視需要:  const userId = req.user ? req.user.userId : null;
    const userId = null;
    const newFile = await File.create({
      filename: req.file.filename,
      fingerprint,
      user_id: userId
    });

    return res.json({
      success: true,
      fileId: newFile.id,
      message: '已上傳成功 (Sequelize)'
    });
  } catch (err) {
    console.error('[POST /protect/step1] error:', err);
    return res.status(500).json({ success:false, message:'伺服器錯誤' });
  }
});

// 其他 step2, step3... 同理
module.exports = router;
