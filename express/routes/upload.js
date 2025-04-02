const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { create } = require('ipfs-http-client');

// 初始化 IPFS 客戶端
const ipfs = create({ url: 'http://ipfs:5001/api/v0' });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const result = await ipfs.add(fileBuffer);
    // 刪除暫存檔
    fs.unlinkSync(req.file.path);
    res.json({ message: '檔案上傳成功', ipfsHash: result.cid.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
