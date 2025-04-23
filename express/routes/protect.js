/*******************************************************
 * express/routes/protect.js
 * - 作品保護: 上傳 & 下載證明
 *******************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 若需 IPFS/區塊鏈
const { uploadToIPFS } = require('../utils/ipfs');
const { storeRecord } = require('../utils/chain');

// 設定 multer
const uploadPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix);
  }
});
const upload = multer({ storage });

// 假的「作品資料庫」，若有 Sequelize model 可替換
let mockWorks = [];
let mockUser = { id:1, isPaid:false };

// 1) 上傳 /api/protect/step1
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    const { realName, phone, address, email } = req.body;
    if (!req.file) {
      return res.status(400).json({ success:false, message:'未上傳檔案' });
    }
    if (!realName || !phone || !address || !email) {
      return res.status(400).json({ success:false, message:'缺少必填欄位' });
    }

    const filePath = path.join(uploadPath, req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // IPFS + 區塊鏈
    // const ipfsHash = await uploadToIPFS(filePath);
    // const chainReceipt = await storeRecord(sha256, ipfsHash);

    // 寫入 mockWorks
    const newWork = {
      workId: mockWorks.length +1,
      userId: mockUser.id,
      filename: req.file.filename,
      fingerprint: sha256,
      // ipfsHash, txHash: chainReceipt.transactionHash
      createdAt: new Date()
    };
    mockWorks.push(newWork);

    return res.json({ success:true, workId:newWork.workId });
  } catch (err) {
    console.error('[Protect/step1] error:', err);
    return res.status(500).json({ success:false, message:'Server error' });
  }
});

// 2) 下載證明 /api/protect/certificate/:workId
router.get('/certificate/:workId', (req, res) => {
  const wId = parseInt(req.params.workId,10);
  const work = mockWorks.find(x => x.workId===wId);
  if (!work) {
    return res.status(404).json({ success:false, message:'作品不存在' });
  }
  // 檢查付費
  if (!mockUser.isPaid) {
    return res.status(403).json({ success:false, message:'尚未付費' });
  }
  const filePath = path.join(uploadPath, work.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success:false, message:'檔案遺失' });
  }
  return res.download(filePath, `certificate-${work.filename}`);
});

// 3) 偵測侵權 /api/protect/infringement/:workId
router.get('/infringement/:workId', (req, res) => {
  const wId = parseInt(req.params.workId,10);
  const work = mockWorks.find(x => x.workId===wId);
  if (!work) {
    return res.status(404).json({ success:false, message:'作品不存在' });
  }
  if (!mockUser.isPaid) {
    return res.status(403).json({ success:false, message:'尚未付費, 無法查詢侵權' });
  }
  // 假裝AI無侵權
  return res.json({ success:true, data:{ isInfringed:false, detail:'No infringement found' } });
});

module.exports = router;
