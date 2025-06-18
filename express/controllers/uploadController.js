// express/controllers/uploadController.js

const fs = require('fs');
const { File, User } = require('../models');
const chain = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const fingerprintService = require('../services/fingerprintService');

const uploadController = {
  async uploadFile(req, res) {
    try {
      // 1) 驗證是否有檔案
      if (!req.file) {
        return res.status(400).json({ error: '沒有收到檔案' });
      }

      const userId = req.user.userId; // 由 JWT decode (若您希望保留)
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: '找不到使用者' });
      }

      // 2) 讀取本地檔案
      const filePath = req.file.newPath || req.file.path;
      const fileBuffer = fs.readFileSync(filePath);

      // 2.1) 檢查檔案 MIME 類型
      if (!/^image\//i.test(req.file.mimetype) && !/^video\//i.test(req.file.mimetype)) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      // 3) 計算指紋 (SHA256)
      const fingerprint = fingerprintService.sha256(fileBuffer);

      // 4) (可選) 上傳到 IPFS
      let ipfsHash = null;
      try {
        ipfsHash = await ipfsService.saveFile(fileBuffer);
      } catch (e) {
        console.error('[IPFS] 上傳失敗:', e.message);
      }

      // 5) (可選) 上鏈
      let txHash = null;
      try {
        const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
        txHash = receipt.transactionHash;
      } catch (e) {
        console.error('[區塊鏈] storeRecord 失敗:', e.message);
      }

      // 6) 建立 File 紀錄
      const newFile = await File.create({
        user_id: userId,
        filename: req.file.originalname,
        fingerprint,
        ipfs_hash: ipfsHash,
        tx_hash: txHash,
      });

      // 7) 刪除本地暫存
      fs.unlinkSync(filePath);

      // 8) 更新使用者上傳次數 (video 或 image)
      if (req.file.mimetype.startsWith('video')) {
        user.uploadVideos++;
      } else {
        user.uploadImages++;
      }
      await user.save();

      // 9) 回傳
      return res.json({
        message: '上傳成功',
        fileId: newFile.id,
        fingerprint,
        ipfsHash,
        txHash,
      });
    } catch (err) {
      console.error('[uploadFile error]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // 如果您想直接在此 controller 中產生 PDF 憑證與報告，也可新增
  // 例如 generateCertificate / generateReport 等函式 (如同前文示例)...
};

module.exports = uploadController;
