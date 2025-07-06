// express/routes/protect.js (功能升級版：修正檔名亂碼、新增縮圖)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // 需要 sharp 套件來處理圖片
const logger = require('../utils/logger');
const { File, UsageRecord } = require('../models');
// ... 其他 require 保持不變 ...
const auth = require('../middleware/auth');
const checkQuota = require('../middleware/quotaCheck');
const chain = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const fingerprintService = require('../services/fingerprintService');
const queueService = require('../services/queue.service');

const router = express.Router();
const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');
const THUMBNAIL_DIR = path.join(UPLOAD_BASE_DIR, 'thumbnails');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(THUMBNAIL_DIR)) fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });

const upload = multer({ dest: TEMP_DIR, limits: { /* ... */ } });

// [FIX] 修正檔名亂碼問題的處理函式
const handleFileUpload = async (file, userId, body) => {
    const { path: tempPath, mimetype } = file;
    // 關鍵修正：將 multer 預設的 latin1 編碼檔名，轉回正確的 UTF-8
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const { title, keywords } = body;

    const fileBuffer = fs.readFileSync(tempPath);
    const fingerprint = fingerprintService.sha256(fileBuffer);

    const existingFile = await File.findOne({ where: { fingerprint } });
    if (existingFile) {
        throw { status: 409, message: '此圖片先前已被保護。', file: existingFile };
    }

    // [新功能] 產生縮圖
    const thumbnailFilename = `${fingerprint}_thumb.jpg`;
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);
    await sharp(fileBuffer)
        .resize(300, 300, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

    const ipfsHash = await ipfsService.saveFile(fileBuffer);
    const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);

    const newFile = await File.create({
        user_id: userId,
        filename: originalname,
        title: title || originalname,
        keywords,
        fingerprint,
        ipfs_hash: ipfsHash,
        tx_hash: txReceipt.transactionHash,
        status: 'protected',
        mime_type: mimetype,
        thumbnail_path: `/uploads/thumbnails/${thumbnailFilename}` // 儲存可供前端訪問的相對路徑
    });

    await UsageRecord.create({ user_id: userId, feature_code: 'image_upload' });

    // 派發背景掃描任務
    queueService.sendToQueue({
        taskId: `${newFile.id}-${Date.now()}`,
        fileId: newFile.id,
        ipfsHash: newFile.ipfs_hash,
        fingerprint: newFile.fingerprint,
    }).catch(err => logger.error(`Failed to dispatch scan task for File ID ${newFile.id}`, err));

    return newFile;
};

// 單一檔案上傳路由
router.post('/step1', auth, checkQuota('image_upload'), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: '未提供檔案。' });

    try {
        const newFile = await handleFileUpload(req.file, req.user.id, req.body);
        res.status(201).json({ message: '檔案保護成功！', file: newFile });
    } catch (error) {
        logger.error('[Step 1] Error:', error);
        res.status(error.status || 500).json({ message: error.message, file: error.file });
    } finally {
        if(req.file) fs.unlink(req.file.path, () => {});
    }
});

// 批量上傳路由
router.post('/batch-protect', auth, checkQuota('image_upload'), upload.array('files', 20), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: '未提供任何檔案。' });

    const results = [];
    for (const file of req.files) {
        try {
            const newFile = await handleFileUpload(file, req.user.id, {});
            results.push({ filename: newFile.filename, status: 'success', fileId: newFile.id });
        } catch (error) {
            results.push({ filename: Buffer.from(file.originalname, 'latin1').toString('utf8'), status: 'failed', reason: error.message });
        } finally {
            fs.unlink(file.path, () => {});
        }
    }
    res.status(207).json({ message: '批量保護任務已完成。', results });
});

// ... 其他路由 ...
module.exports = router;
