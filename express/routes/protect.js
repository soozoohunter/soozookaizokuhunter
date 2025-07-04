// express/routes/protect.js (架構統一版)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const auth = require('../middleware/auth'); // 基礎身份驗證
const checkQuota = require('../middleware/quotaCheck');
const { User, File, Scan, UsageRecord } = require('../models');
const chain = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const fingerprintService = require('../services/fingerprintService');
const { generateCertificatePDF } = require('../services/pdf.service.js');
const queueService = require('../services/queue.service');

const router = express.Router();

const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const MAX_BATCH_UPLOAD = 20;
const upload = multer({
    dest: TEMP_DIR,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: MAX_BATCH_UPLOAD,
    },
});

// 單一檔案保護路由 (假設已登入)
router.post('/step1', auth, checkQuota('image_upload'), upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '未提供檔案。' });
    }

    const userId = req.user.id;
    const { title, keywords } = req.body;
    const { path: tempPath, originalname, mimetype } = req.file;

    try {
        const fileBuffer = fs.readFileSync(tempPath);
        const fingerprint = fingerprintService.sha256(fileBuffer);

        const existingFile = await File.findOne({ where: { fingerprint } });
        if (existingFile) {
            return res.status(409).json({ message: '此圖片先前已被保護。', file: existingFile });
        }

        const ipfsHash = await ipfsService.saveFile(fileBuffer);
        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);

        const newFile = await File.create({
            user_id: userId,
            filename: originalname,
            title,
            keywords,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txReceipt.transactionHash,
            status: 'protected',
            mime_type: mimetype,
        });

        // 在 UsageRecords 中新增一筆上傳紀錄
        await UsageRecord.create({ user_id: userId, feature_code: 'image_upload' });

        logger.info(`[Step 1] File ID ${newFile.id} protected successfully for user ${userId}.`);
        res.status(201).json({ message: '檔案保護成功！', file: newFile });
    } catch (error) {
        logger.error('[Step 1] Error during protection process:', error);
        res.status(500).json({ message: '伺服器內部錯誤', error: error.message });
    } finally {
        fs.unlink(tempPath, () => {});
    }
});

// 批量保護的 API 路由
router.post('/batch-protect', auth, checkQuota('image_upload'), upload.array('files', MAX_BATCH_UPLOAD), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '未提供任何檔案。' });
    }

    const userId = req.user.id;
    const results = [];
    const usageRecords = [];

    for (const file of req.files) {
        const { path: tempPath, originalname, mimetype } = file;
        try {
            const fileBuffer = fs.readFileSync(tempPath);
            const fingerprint = fingerprintService.sha256(fileBuffer);
            const existingFile = await File.findOne({ where: { fingerprint } });

            if (existingFile) {
                results.push({ filename: originalname, status: 'failed', reason: 'Conflict: File already protected.' });
                continue;
            }

            const ipfsHash = await ipfsService.saveFile(fileBuffer);
            const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);

            const newFile = await File.create({
                user_id: userId,
                filename: originalname,
                title: originalname,
                fingerprint,
                ipfs_hash: ipfsHash,
                tx_hash: txReceipt.transactionHash,
                status: 'protected',
                mime_type: mimetype,
            });

            // 準備一筆用量紀錄，稍後一次性寫入
            usageRecords.push({ user_id: userId, feature_code: 'image_upload' });
            results.push({ filename: originalname, status: 'success', fileId: newFile.id });

            // 派發背景掃描任務
            setImmediate(() => queueService.sendToQueue({
                taskId: `${newFile.id}-${Date.now()}`,
                fileId: newFile.id,
                ipfsHash: newFile.ipfs_hash,
                fingerprint: newFile.fingerprint,
            }));
        } catch (error) {
            logger.error(`[Batch Protect] Failed to process file ${originalname}:`, error);
            results.push({ filename: originalname, status: 'failed', reason: error.message });
        } finally {
            fs.unlink(tempPath, () => {});
        }
    }

    if (usageRecords.length > 0) {
        await UsageRecord.bulkCreate(usageRecords);
        logger.info(`[Batch Protect] Logged ${usageRecords.length} upload usages for user ${userId}.`);
    }

    res.status(207).json({ message: '批量保護任務已完成。', results });
});

// 掃描任務派發路由
async function dispatchScanTask(req, res) {
    const fileId = req.params.fileId || req.body.fileId;
    try {
        const fileRecord = await File.findByPk(fileId);
        if (!fileRecord) {
            return res.status(404).json({ error: `File with ID ${fileId} not found.` });
        }
        if (req.user.id !== fileRecord.user_id) {
            return res.status(403).json({ error: 'Permission denied.' });
        }
        const newScan = await Scan.create({ file_id: fileId, status: 'pending' });
        await UsageRecord.create({ user_id: req.user.id, feature_code: 'scan' });

        await queueService.sendToQueue({
            taskId: newScan.id,
            fileId: fileId,
            ipfsHash: fileRecord.ipfs_hash,
            fingerprint: fileRecord.fingerprint,
        });
        res.status(202).json({ message: '掃描請求已接受，正在背景處理中。', taskId: newScan.id });
    } catch (error) {
        logger.error(`[Scan Dispatch] Failed to dispatch scan task for File ID ${fileId}:`, error);
        res.status(500).json({ error: 'Failed to dispatch scan task.' });
    }
}

router.post('/step2', auth, checkQuota('scan'), dispatchScanTask);
router.get('/scan/:fileId', auth, checkQuota('scan'), dispatchScanTask);

// 任務狀態與檢視路由保持不變
router.get('/task/:taskId', async (req, res) => {
    const { taskId } = req.params;
    try {
        const task = await Scan.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ error: '找不到指定的任務。' });
        }
        res.status(200).json({
            taskId: task.id,
            status: task.status,
            results: task.result,
            updatedAt: task.updatedAt,
        });
    } catch (error) {
        logger.error(`[Task Status] Failed to get status for task ID ${taskId}:`, error);
        res.status(500).json({ error: '查詢任務狀態失敗。' });
    }
});

router.get('/view/:fileId', async (req, res) => {
    // ...
});

module.exports = router;
