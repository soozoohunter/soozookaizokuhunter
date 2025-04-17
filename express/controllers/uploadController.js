/********************************************************************
 * controllers/uploadController.js
 * 負責接收上傳檔案 -> fingerprint -> IPFS / blockchain -> DB
 * 
 * 企業級增強之處：
 *  1. 若 planMiddleware 有在 req.usageLeft 提供「剩餘可用次數」，這裡可日誌提示
 *  2. 更細的例外處理 / 日誌紀錄 (例如 IPFS、區塊鏈失敗)
 *  3. 不變更任何原有邏輯，只是增補
 ********************************************************************/
const fs = require('fs');
const path = require('path');
const { File, User } = require('../models');
const chain = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const fingerprintService = require('../services/fingerprintService');

const uploadController = {
  async uploadFile(req, res) {
    try {
      // ==================================================
      // 1) 取得目前使用者ID，檢查檔案是否存在
      // ==================================================
      const userId = req.user.userId;
      if (!req.file) {
        return res.status(400).json({ error: '沒有收到檔案' });
      }

      // [可選] 若 planMiddleware 有設定 req.usageLeft，可在此對外提示
      if (req.usageLeft) {
        console.log(`[uploadController] usage left => videos: ${req.usageLeft.videos}, images: ${req.usageLeft.images}`);
      }

      // ==================================================
      // 2) 讀取檔案內容
      // ==================================================
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);

      // ==================================================
      // 3) 計算指紋 (SHA-256)
      // ==================================================
      const fingerprint = fingerprintService.sha256(fileBuffer);

      // ==================================================
      // 4) (可選) 上傳到 IPFS
      // ==================================================
      let ipfsHash = null;
      try {
        ipfsHash = await ipfsService.saveFile(fileBuffer);
      } catch (e) {
        console.error('[uploadFile] IPFS 上傳失敗:', e.message);
        // 企業級：可視需求選擇是否要 return 或繼續
      }

      // ==================================================
      // 5) (可選) 上鏈
      // ==================================================
      let txHash = null;
      try {
        txHash = await chain.storeFileRecord(fingerprint, ipfsHash || '');
      } catch (e) {
        console.error('[uploadFile] 區塊鏈 storeRecord 失敗:', e.message);
        // 同上，可依需求決定是否要 return 或繼續
      }

      // ==================================================
      // 6) 寫入資料庫 File 表
      // ==================================================
      const newFile = await File.create({
        user_id: userId,
        filename: req.file.originalname,
        fingerprint,
        ipfs_hash: ipfsHash || null,
        tx_hash: txHash || null
      });

      // ==================================================
      // 7) 刪除本地暫存檔案
      // ==================================================
      fs.unlinkSync(filePath);

      // ==================================================
      // 8) 更新使用者上傳次數 (video / image)
      // ==================================================
      const user = await User.findByPk(userId);
      // 簡單判斷是否是圖片或影片
      if (req.file.mimetype.startsWith('video')) {
        user.uploadVideos++;
      } else {
        user.uploadImages++;
      }
      await user.save();

      // ==================================================
      // 9) 回傳結果
      // ==================================================
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
