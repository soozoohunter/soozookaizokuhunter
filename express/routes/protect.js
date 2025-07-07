// express/routes/protect.js (功能升級版：修正檔名亂碼、新增縮圖)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // 需要 sharp 套件來處理圖片
const logger = require('../utils/logger');
const { File, Scan, UsageRecord, User } = require('../models');
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

const upload = multer({ dest: TEMP_DIR, limits: { fileSize: 100 * 1024 * 1024 } });
const MAX_BATCH_UPLOAD = 20;

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

    // 紀錄用量
    await UsageRecord.create({ user_id: userId, feature_code: 'image_upload' });

    // [新增] 自動派發初次掃描任務
    const newScan = await Scan.create({ file_id: newFile.id, status: 'pending' });
    await UsageRecord.create({ user_id: userId, feature_code: 'scan' });

    await queueService.sendToQueue({
        taskId: newScan.id,
        fileId: newFile.id,
        userId: userId,
        ipfsHash: newFile.ipfs_hash,
        fingerprint: newFile.fingerprint,
    });

    logger.info(`[File Upload] Protected and dispatched scan task ${newScan.id} for file ${newFile.id}`);
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
router.post('/batch-protect', auth, checkQuota('image_upload'), upload.array('files', MAX_BATCH_UPLOAD), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: '未提供任何檔案。' });

    const results = [];
    for (const file of req.files) {
        try {
            const newFile = await handleFileUpload(file, req.user.id, {});
            results.push({ filename: newFile.filename, status: 'success', fileId: newFile.id });
        } catch (error) {
            results.push({ filename: Buffer.from(file.originalname, 'latin1').toString('utf8'), status: 'failed', reason: error.message });
        } finally {
            if (file && file.path) {
                fs.unlink(file.path, () => {});
            }
        }
    }
    res.status(207).json({ message: '批量保護任務已完成。', results });
});

// 重新啟動掃描任務（Step2）
router.post('/step2', auth, async (req, res) => {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: '缺少檔案ID' });

    try {
        const file = await File.findByPk(fileId);
        if (!file) return res.status(404).json({ error: '找不到對應的檔案紀錄' });

        const scan = await Scan.create({ file_id: file.id, status: 'pending' });
        await UsageRecord.create({ user_id: file.user_id, feature_code: 'scan' });

        await queueService.sendToQueue({
            taskId: scan.id,
            fileId: file.id,
            userId: file.user_id,
            ipfsHash: file.ipfs_hash,
            fingerprint: file.fingerprint,
        });

        res.status(202).json({ message: '掃描任務已派發', taskId: scan.id });
    } catch (err) {
        logger.error('[Step 2] Failed to dispatch scan task:', err);
        res.status(500).json({ error: '無法派發掃描任務' });
    }
});

// ... 其他路由 ...
module.exports = router;
