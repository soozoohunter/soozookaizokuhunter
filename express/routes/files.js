const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { File, Scan } = require('../models');
const auth = require('../middleware/auth');
// const planCheck = require('../middleware/planCheck'); // 建議未來加入此中介層來檢查額度
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const queueService = require('../services/queue.service');
const logger = require('../utils/logger');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join('/app/uploads', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

// [MEMBER API] 批量上傳 (受會員權限保護)
router.post('/batch-upload', auth, upload.array('files', 20), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: '沒有上傳任何檔案' });
    }

    const userId = req.user.id;
    const results = [];
    const errors = [];

    for (const file of req.files) {
        const { path: tempFilePath, originalname, mimetype, size } = file;
        try {
            const fileBuffer = fs.readFileSync(tempFilePath);
            const fingerprint = fingerprintService.sha256(fileBuffer);
            
            const ipfsHash = await ipfsService.saveFile(fileBuffer);
            const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);

            const newFile = await File.create({
                user_id: userId,
                filename: originalname,
                title: originalname.split('.').slice(0, -1).join('.'),
                fingerprint,
                ipfs_hash: ipfsHash,
                tx_hash: txReceipt?.transactionHash || null,
                status: 'protected',
                mime_type: mimetype,
                size: size
            });
            results.push({ filename: originalname, success: true, fileId: newFile.id });
        } catch (error) {
            logger.error(`[Batch Upload] Error processing ${originalname}:`, error);
            errors.push({ filename: originalname, success: false, error: error.message });
        } finally {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }
    }
    
    res.status(207).json({ 
        message: '批量上傳處理完成',
        results,
        errors
    });
});

// [MEMBER API] 批量掃描 (受會員權限保護)
router.post('/batch-scan', auth, async (req, res) => {
    const { fileIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ message: '請提供檔案 ID 陣列' });
    }
    
    const dispatchedTasks = [];
    for (const fileId of fileIds) {
        const file = await File.findOne({ where: { id: fileId, user_id: userId } });
        if(file) {
            const scan = await Scan.create({ file_id: file.id, user_id: userId, status: 'pending' });
            await queueService.sendToQueue({ 
                scanId: scan.id, 
                fileId: file.id, 
                userId: userId,
                ipfsHash: file.ipfs_hash,
                fingerprint: file.fingerprint,
                keywords: file.keywords
            });
            dispatchedTasks.push({ fileId: file.id, scanId: scan.id });
        }
    }
    
    res.status(202).json({ message: '批量掃描任務已派發', tasks: dispatchedTasks });
});


// [MEMBER API] 獲取單一檔案的詳細資訊及其所有掃描紀錄
router.get('/:fileId', auth, async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;

        const file = await File.findOne({
            where: { id: fileId, user_id: userId },
            include: [{ model: Scan, as: 'Scans', order: [['createdAt', 'DESC']] }]
        });

        if (!file) {
            return res.status(404).json({ error: '找不到檔案或權限不足' });
        }
        res.json(file);
    } catch (error) {
        logger.error(`[File Detail API Error] Failed to fetch details for file ID ${req.params.fileId}:`, error);
        res.status(500).json({ error: '讀取檔案資料失敗' });
    }
});

module.exports = router;
