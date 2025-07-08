// express/routes/protect.js (最終邏輯修正版)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');
const checkQuota = require('../middleware/quotaCheck');
const { File, Scan, UsageRecord } = require('../models');
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

// [核心] 抽取出的、可重用的單一檔案處理函式
const handleFileUpload = async (file, userId, body) => {
    const { path: tempPath, mimetype } = file;
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const { title, keywords } = body;
    
    const fileBuffer = fs.readFileSync(tempPath);
    const fingerprint = fingerprintService.sha256(fileBuffer);
    
    const existingFile = await File.findOne({ where: { fingerprint } });
    if (existingFile) {
        throw { status: 409, message: '此圖片先前已被保護。', file: existingFile };
    }

    const thumbnailFilename = `${fingerprint}_thumb.jpg`;
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);
    await sharp(fileBuffer).resize(300, 300, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(thumbnailPath);

    // [FIX] 將並行操作改為依序 await，確保先取得 ipfsHash
    const ipfsHash = await ipfsService.saveFile(fileBuffer);
    if (!ipfsHash) {
        throw new Error('Failed to save file to IPFS.');
    }
    
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
        thumbnail_path: `/uploads/thumbnails/${thumbnailFilename}`
    });

    await UsageRecord.create({ user_id: userId, feature_code: 'image_upload' });
    
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

// 批量上傳路由
router.post('/batch-protect', auth, checkQuota('image_upload'), upload.array('files', MAX_BATCH_UPLOAD), async (req, res) => {
    if (!req.files || !req.files.length) {
        return res.status(400).json({ error: '未提供任何檔案。' });
    }

    const results = [];
    for (const file of req.files) {
        try {
            const newFile = await handleFileUpload(file, req.user.id, {});
            results.push({ filename: newFile.filename, status: 'success', fileId: newFile.id });
        } catch (error) {
            const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            results.push({ filename: originalname, status: 'failed', reason: error.message });
        } finally {
            if (file && file.path) {
                fs.unlink(file.path, () => {});
            }
        }
    }
    res.status(207).json({ message: '批量保護任務已完成。', results });
});

// 手動觸發掃描的路由
async function dispatchScanTask(req, res) {
    const fileId = req.params.fileId || req.body.fileId;
    try {
        const fileRecord = await File.findByPk(fileId);
        if (!fileRecord) {
            return res.status(404).json({ error: `File with ID ${fileId} not found.` });
        }
        if (req.user.id !== fileRecord.user_id) {
             return res.status(403).json({ error: 'Permission denied. You do not own this file.' });
        }
        
        const newScan = await Scan.create({ file_id: fileId, status: 'pending' });
        await UsageRecord.create({ user_id: req.user.id, feature_code: 'scan' });
        
        await queueService.sendToQueue({
            taskId: newScan.id,
            fileId: fileId,
            userId: req.user.id,
            ipfsHash: fileRecord.ipfs_hash,
            fingerprint: fileRecord.fingerprint,
        });

        res.status(202).json({ message: '掃描請求已接受，正在背景處理中。', taskId: newScan.id });
    } catch (error) {
        logger.error(`[Scan Dispatch] Failed to dispatch scan task for File ID ${fileId}:`, error);
        res.status(500).json({ error: 'Failed to dispatch scan task.' });
    }
}

router.get('/scan/:fileId', auth, checkQuota('scan'), dispatchScanTask);

module.exports = router;
