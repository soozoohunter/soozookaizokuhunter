// controllers/uploadController.js
const FileRecord = require('../models/File');                // 假設我們有一個文件紀錄的模型
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const blockchainService = require('../services/blockchainService');
const User = require('../models/User');

const UploadController = {
  uploadFile: async (req, res, next) => {
    try {
      // Multer 已將檔案資訊附加在 req.file 上
      if (!req.file) {
        return res.status(400).json({ message: '未收到檔案' });
      }
      const userId = req.user.userId;         // 從 authMiddleware 附加的 payload 取得使用者ID
      const fileBuffer = req.file.buffer;     // 檔案的 Buffer (因為使用 memoryStorage)
      const originalName = req.file.originalname;

      // 1. 圖像指紋比對服務：傳送檔案以取得指紋與重複性檢查
      const { fingerprint, duplicate, matchId } = await fingerprintService.checkImage(fileBuffer);
      if (duplicate) {
        // 如服務回報已存在相似檔案，可選擇拒絕重複上傳
        return res.status(409).json({ message: '上傳失敗：檔案與現有檔案重複', matchId });
      }

      // 2. 儲存檔案至 IPFS 去中心化存儲
      const cid = await ipfsService.saveFile(fileBuffer);
      // （可選）等待 IPFS 完成 Pin 動作

      // 3. 將指紋上鏈儲存（透過智能合約）
      await blockchainService.storeFingerprint(fingerprint);

      // 4. 在本地資料庫記錄上傳檔案資訊
      const fileRecord = await FileRecord.create({
        user: userId,
        fileName: originalName,
        ipfsCid: cid,
        fingerprint: fingerprint
      });

      // 5. 更新使用者的上傳次數計數
      await User.findByIdAndUpdate(userId, { $inc: { uploadsUsed: 1 } });

      // 回傳成功結果，包含IPFS CID等資訊
      return res.status(201).json({ 
        message: '上傳成功', 
        file: {
          id: fileRecord._id,
          fileName: originalName,
          ipfsCid: cid,
          fingerprint: fingerprint
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = UploadController;
