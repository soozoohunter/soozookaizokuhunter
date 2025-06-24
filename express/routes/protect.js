/**
 * express/routes/protect.js (修正版)
 *
 * 【核心修正】:
 * 1.  在 Step 1 (檔案註冊) 流程中，增加了「指紋存在性檢查」。
 * 2.  在上傳檔案並計算出 fingerprint 後，會先查詢資料庫。
 * 3.  若 fingerprint 已存在，則直接回傳 409 Conflict 錯誤，告知前端該檔案已被註冊，並中斷後續流程。
 * 4.  若 fingerprint 不存在，才繼續執行 IPFS 上傳、區塊鏈上鏈、以及資料庫寫入操作。
 * 5.  優化了錯誤處理，對 Sequelize 的 unique constraint 錯誤有更明確的回應。
 */
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { File, User } = require('../models');
const ipfsService = require('../utils/ipfsService');
const { storeRecord } = require('../utils/chain');
const { indexImage, findSimilarImages } = require('../utils/milvus'); // 引入 Milvus 服務
const logger = require('../utils/logger');
const { convertAndUpload, createPublicImageLink } = require('../utils/imageProcessor');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

/**
 * 計算檔案的 SHA256 指紋
 * @param {string} filePath - 檔案路徑
 * @returns {Promise<string>} - SHA256 指紋
 */
const getFileFingerprint = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
};

/**
 * @route   POST /api/protect/step1
 * @desc    接收圖片上傳，計算指紋，上傳至 IPFS，紀錄於區塊鏈，最後存入 DB。
 * @access  Private (需身份驗證)
 */
router.post('/step1', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided.' });
  }

  // 假設 user ID 為 1 (測試用)，正式環境應從 req.user 取得
  const userId = req.user ? req.user.id : 1; 

  try {
    const fingerprint = await getFileFingerprint(req.file.path);

    // 【*核心修正*】: 檢查 fingerprint 是否已存在
    const existingFile = await File.findOne({ where: { fingerprint } });
    if (existingFile) {
      logger.warn(`[POST /step1] Duplicate file upload detected. Fingerprint: ${fingerprint.slice(0, 20)}...`);
      fs.unlinkSync(req.file.path); // 刪除已上傳的暫存檔案
      return res.status(409).json({ // 409 Conflict: 請求衝突，資源已存在
        message: 'This image has already been protected.',
        error: 'Conflict',
        file: existingFile
      });
    }

    // 若不存在，繼續正常流程
    const fileBuffer = fs.readFileSync(req.file.path);
    const ipfsResult = await ipfsService.saveFile(fileBuffer);
    const txResult = await storeRecord(fingerprint, ipfsResult.cid.toString());
    
    if (!txResult) {
        throw new Error('Failed to get transaction hash from blockchain service.');
    }

    const newFile = await File.create({
      user_id: userId,
      filename: req.file.originalname,
      fingerprint: fingerprint,
      ipfs_hash: ipfsResult.cid.toString(),
      tx_hash: txResult.transactionHash,
      status: 'protected', // 初始狀態
    });

    // 將圖片索引到 Milvus 中
    try {
        await indexImage(req.file.path, newFile.id.toString());
        logger.info(`[Milvus] Successfully indexed fileId: ${newFile.id}`);
    } catch (milvusError) {
        // Milvus 索引失敗不應中斷主流程，但需記錄錯誤
        logger.error(`[Milvus] Failed to index fileId: ${newFile.id}`, milvusError);
    }


    fs.unlinkSync(req.file.path); // 成功處理後刪除暫存檔案

    res.status(201).json({
      message: 'File protected successfully!',
      file: newFile
    });

  } catch (error) {
    logger.error('[POST /step1] Error', error);

    // 刪除上傳的暫存檔案以清理空間
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }

    // 針對性錯誤回傳
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Conflict: This file fingerprint already exists.', error: error.fields });
    }

    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


/**
 * @route   POST /api/protect/step2
 * @desc    接收檔案 ID，進行侵權掃描 (此處為模擬，實際應觸發背景任務)
 * @access  Private
 */
router.post('/step2', async (req, res) => {
    const { fileId } = req.body;

    if (!fileId) {
        return res.status(400).json({ error: 'fileId is required.' });
    }

    try {
        const file = await File.findByPk(fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found.' });
        }

        // 步驟 1: 建立一個可用於向量搜尋的暫存圖片
        const { tempImagePath, publicUrl } = await convertAndUpload(file.id);
        logger.info(`[Step 2] Created temp image for search at ${tempImagePath} (${publicUrl})`);

        // 步驟 2: 使用 Milvus 進行以圖搜圖
        const similarResults = await findSimilarImages(tempImagePath, 20); // 尋找最相似的 20 張
        
        // 過濾掉自己 (distance 為 0)
        const infringingLinks = similarResults
            .filter(r => r.distance > 0.001) 
            .map(r => ({
                url: createPublicImageLink(r.id), // 假設 ID 對應到某個公開 URL
                distance: r.distance,
                fileId: r.id,
            }));

        // 更新檔案狀態與結果
        file.status = 'scanned';
        file.infringingLinks = infringingLinks; // 直接儲存 JSON
        await file.save();
        
        // 刪除用於搜尋的暫存圖片
        fs.unlinkSync(tempImagePath);

        logger.info(`[Step 2] Scan complete for fileId: ${fileId}. Found ${infringingLinks.length} potential infringements.`);

        res.status(200).json({
            message: 'Scan completed.',
            results: infringingLinks,
            file: file,
        });

    } catch (error) {
        logger.error(`[POST /step2] Scan Error for fileId: ${fileId}`, error);
        res.status(500).json({ message: 'Internal Server Error during scan process.' });
    }
});


module.exports = router;
