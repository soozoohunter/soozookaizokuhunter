/********************************************************************
 * controllers/uploadController.js
 * 負責接收上傳檔案 -> fingerprint -> IPFS / blockchain -> DB
 ********************************************************************/
const fs = require('fs');
const { File, User } = require('../models');
const chain = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const fingerprintService = require('../services/fingerprintService');

const uploadController = {
  async uploadFile(req, res) {
    try {
      const userId = req.user.userId;
      if (!req.file) {
        return res.status(400).json({ error: '沒有收到檔案' });
      }

      // 讀取檔案
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);

      // 計算指紋
      const fingerprint = fingerprintService.sha256(fileBuffer);

      // (可選) 上傳到 IPFS
      let ipfsHash = null;
      try {
        ipfsHash = await ipfsService.saveFile(fileBuffer);
      } catch (e) {
        console.error('IPFS 上傳失敗:', e.message);
      }

      // (可選) 上鏈
      let txHash = null;
      try {
        txHash = await chain.storeFileRecord(fingerprint, ipfsHash || '');
      } catch (e) {
        console.error('區塊鏈 storeRecord 失敗:', e.message);
      }

      // 寫入 DB
      const newFile = await File.create({
        user_id: userId,
        filename: req.file.originalname,
        fingerprint,
        ipfs_hash: ipfsHash || null,
        tx_hash: txHash || null
      });

      // 刪除本地暫存
      fs.unlinkSync(filePath);

      // 更新 user 上傳次數
      const user = await User.findByPk(userId);
      if (req.file.mimetype.startsWith('video')) {
        user.uploadVideos++;
      } else {
        user.uploadImages++;
      }
      await user.save();

      return res.json({
        message: '上傳成功',
        fileId: newFile.id,
        fingerprint,
        ipfsHash,
        txHash
      });
    } catch (err) {
      console.error('[uploadFile error]', err);
      return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = uploadController;
