const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { File, Scan } = require('../models');
const auth = require('../middleware/auth');
const planCheck = require('../middleware/planCheck');
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

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 付費會員上傳限制提高到 200MB

// ★★★ 新增：批量上傳 API ★★★
router.post('/batch-upload', [auth, planCheck('upload')], upload.array('files', 20), async (req, res) => {
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

    // 更新用戶已使用額度 (可以在 planCheck 中介層或此處實作)
    
    res.status(207).json({ 
        message: '批量上傳處理完成',
        results,
        errors
    });
});


// ★★★ 新增：批量掃描 API ★★★
router.post('/batch-scan', [auth, planCheck('scan')], async (req, res) => {
    const { fileIds } = req.body; // 前端傳來一個 fileId 陣列
    const userId = req.user.id;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ message: '請提供檔案 ID 陣列' });
    }
    
    const dispatchedTasks = [];
    for (const fileId of fileIds) {
        const file = await File.findOne({ where: { id: fileId, user_id: userId } });
        if(file) {
            const scan = await Scan.create({ file_id: file.id, user_id: userId, status: 'pending' });
            await queueService.sendToQueue({ scanId: scan.id, fileId: file.id, userId: userId });
            dispatchedTasks.push({ fileId: file.id, scanId: scan.id });
        }
    }
    
    res.status(202).json({ message: '批量掃描任務已派發', tasks: dispatchedTasks });
});


module.exports = router;
