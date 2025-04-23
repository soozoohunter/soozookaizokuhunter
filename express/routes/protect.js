/*************************************************************
 * express/routes/protect.js
 * - 作品保護: 上傳 & 下載證明 & 侵權偵測
 *************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// const { uploadToIPFS } = require('../utils/ipfs');
// const { storeRecord } = require('../utils/chain');

// 設定 uploads 資料夾
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  }
});
const upload = multer({ storage });

// 1) 上傳作品: POST /api/protect/step1
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    const db = req.db;
    const { realName, phone, address, email } = req.body;
    if (!req.file) {
      return res.status(400).json({ success:false, message:'未上傳檔案' });
    }
    if (!realName || !phone || !address || !email) {
      return res.status(400).json({ success:false, message:'缺少必填欄位' });
    }

    // 計算檔案 fingerprint
    const filePath = path.join(uploadDir, req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const fingerprint = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // ★ 可做 IPFS / 區塊鏈上傳:
    // const ipfsHash = await uploadToIPFS(filePath);
    // const chainReceipt = await storeRecord(fingerprint, ipfsHash);

    // 假設無登入 => userId=null
    // TODO: 若您想取 JWT userId，可自行取 req.user.userId
    const userId = null;

    // 寫入 files 資料表 (id, filename, fingerprint, user_id, created_at)
    const sql = `
      INSERT INTO files (filename, fingerprint, user_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `;
    const result = await db.query(sql, [req.file.filename, fingerprint, userId]);
    const fileId = result.rows[0].id;

    return res.json({
      success: true,
      fileId,
      message: '已上傳成功並記錄至資料庫'
      // ipfsHash, txHash: chainReceipt?.transactionHash
    });
  } catch (err) {
    console.error('[POST /protect/step1] error:', err);
    return res.status(500).json({ success:false, message:'伺服器錯誤' });
  }
});

// 2) 下載證明書: GET /api/protect/certificate/:fileId
router.get('/certificate/:fileId', async (req, res) => {
  try {
    const db = req.db;
    const fileId = req.params.fileId;

    // 查詢 files 表
    const fileRes = await db.query(`SELECT * FROM files WHERE id=$1`, [fileId]);
    if (fileRes.rowCount === 0) {
      return res.status(404).json({ success:false, message:'該檔案不存在' });
    }
    const fileRow = fileRes.rows[0];

    // ★ 檢查付費or權限
    // e.g. const payRes = await db.query("SELECT * FROM pending_payments WHERE user_id=$1 AND feature='download_certificate' AND status='APPROVED'", [fileRow.user_id]);
    // if (payRes.rowCount === 0) {
    //   return res.status(403).json({ success:false, message:'尚未付費，無法下載證明' });
    // }

    const filePath = path.join(uploadDir, fileRow.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success:false, message:'伺服器找不到檔案' });
    }

    // 實務上您可先生成 PDF「證明書」，再回傳檔案
    // 這裡先示範「直接下載原檔案」
    return res.download(filePath, `certificate-${fileRow.filename}`);
  } catch (err) {
    console.error('[GET /protect/certificate/:fileId] error:', err);
    return res.status(500).json({ success:false, message:'伺服器錯誤' });
  }
});

// 3) 偵測侵權: GET /api/protect/infringement/:fileId
router.get('/infringement/:fileId', async (req, res) => {
  try {
    const db = req.db;
    const fileId = req.params.fileId;

    // 檢查檔案
    const fileRes = await db.query(`SELECT * FROM files WHERE id=$1`, [fileId]);
    if (fileRes.rowCount === 0) {
      return res.status(404).json({ success:false, message:'該檔案不存在' });
    }
    // ★ 檢查是否付費 or userId 是否符合 ...
    // e.g. if (someCondition) { return res.status(403).json({ ... }); }

    // 這裡先示範回傳「未發現侵權」
    return res.json({
      success: true,
      data: {
        isInfringed: false,
        detail: 'No infringement found.'
      }
    });
  } catch (err) {
    console.error('[GET /protect/infringement/:fileId] error:', err);
    return res.status(500).json({ success:false, message:'伺服器錯誤' });
  }
});

module.exports = router;
