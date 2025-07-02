// express/routes/protect.js (Final Fix for Buffer Type Check)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const { User, File, Scan } = require('../models');

const chain = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const scannerService = require('../services/scanner.service');
const fingerprintService = require('../services/fingerprintService');
const vectorSearchService = require('../services/vectorSearch');
const { generateCertificatePDF, generateScanPDFWithMatches } = require('../services/pdf.service.js');
const queueService = require('../services/queue.service');

const router = express.Router();

const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');
const REPORTS_DIR = path.join(UPLOAD_BASE_DIR, 'reports');
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');

[REPORTS_DIR, TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const upload = multer({
    dest: TEMP_DIR,
    limits: { fileSize: 100 * 1024 * 1024 }
});

router.post('/step1', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '未提供檔案。' });
    }

    const { realName, birthDate, phone, address, email, title, keywords } = req.body;
    const { path: tempPath, originalname, mimetype } = req.file;
    let fileBuffer;

    try {
        fileBuffer = fs.readFileSync(tempPath);

        let user;
        if (req.user?.id) {
            user = await User.findByPk(req.user.id);
        } else if (email || phone) {
            const whereConditions = [];
            if (email) whereConditions.push({ email });
            if (phone) whereConditions.push({ phone });
            user = await User.findOne({ where: { [Op.or]: whereConditions } });
        }

        if (!user) {
            if (!realName || !email) {
                fs.unlinkSync(tempPath);
                return res.status(400).json({ error: '對於新用戶，姓名和電子郵件為必填項。'});
            }
            user = await User.create({ realName, birthDate, phone, address, email });
            logger.info(`[Step 1] New user created: ${user.email} (ID: ${user.id})`);
        }

        const fingerprint = fingerprintService.sha256(fileBuffer);
        const existingFile = await File.findOne({ where: { fingerprint } });
        if (existingFile) {
            logger.warn(`[Step 1] Conflict: File with fingerprint ${fingerprint} already exists.`);
            // No need to unlink here because the finally block will handle it.
            return res.status(409).json({
                message: '此圖片先前已被保護。',
                error: 'Conflict',
                file: existingFile
            });
        }

        const ipfsHash = await ipfsService.saveFile(fileBuffer);
        if (!ipfsHash) throw new Error('Failed to save file to IPFS.');
        logger.info(`[Step 1] File saved to IPFS, CID: ${ipfsHash}`);

        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);
        const txHash = txReceipt.transactionHash;
        logger.info(`[Step 1] Record stored on blockchain, TxHash: ${txHash}`);

        const newFile = await File.create({
            user_id: user.id,
            filename: originalname,
            title,
            keywords,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txHash,
            status: 'protected',
            mime_type: mimetype,
        });
        logger.info(`[Step 1] File record saved to database, File ID: ${newFile.id}`);

        setImmediate(async () => {
            try {
                await vectorSearchService.indexImage(fileBuffer, newFile.id.toString());
                logger.info(`[Background] Vector indexing complete for File ID: ${newFile.id}`);
            } catch (err) {
                logger.error(`[Background] Vector indexing failed for File ID: ${newFile.id}. See previous error log for details.`);
            }

            try {
                const pdfPath = await generateCertificatePDF({ fileId: newFile.id, user, file: newFile });
                logger.info(`[Background] Certificate PDF generated for File ID: ${newFile.id} at ${pdfPath}`);
            } catch (err) {
                logger.error(`[Background] Certificate PDF generation failed for File ID: ${newFile.id}`, err);
            }
        });

        res.status(201).json({ message: '檔案保護成功！', file: newFile });

    } catch (error) {
        logger.error('[Step 1] An error occurred during the protection process:', error);
        res.status(500).json({ message: '伺服器內部錯誤', error: error.message });
    } finally {
        fs.unlink(tempPath, err => {
            if (err) logger.warn(`[Step 1] Failed to delete temp file ${tempPath}:`, err);
        });
    }
});


/**
 * @description Handles the dispatch of a new scan task.
 * It first creates a record in the database, then sends the task to the queue.
 */
async function dispatchScanTask(req, res) {
    const fileId = req.params.fileId || req.body.fileId;
    const routeName = `[Scan Dispatch]`;

    logger.info(`${routeName} Received scan request for File ID: ${fileId}`);

    if (!fileId) {
        return res.status(400).json({ error: 'fileId is required.' });
    }

    try {
        const fileRecord = await File.findByPk(fileId);
        if (!fileRecord) {
            return res.status(404).json({ error: `File with ID ${fileId} not found.` });
        }

        const newScan = await Scan.create({
            file_id: fileId,
            status: 'pending',
        });
        const taskId = newScan.id;
        logger.info(`${routeName} Created new scan task in DB with ID: ${taskId}`);

        const taskMessage = {
            taskId: taskId,
            fileId: fileId,
            ipfsHash: fileRecord.ipfs_hash,
            fingerprint: fileRecord.fingerprint,
        };

        await queueService.sendToQueue(taskMessage);

        res.status(202).json({
            message: '掃描請求已接受，正在背景處理中。',
            taskId: taskId,
            fileId: fileId,
        });

    } catch (error) {
        logger.error(`${routeName} Failed to dispatch scan task for File ID ${fileId}:`, error);
        res.status(500).json({ error: 'Failed to dispatch scan task.' });
    }
}

router.post('/step2', dispatchScanTask);
router.get('/scan/:fileId', dispatchScanTask);

router.get('/task/:taskId', async (req, res) => {
    const { taskId } = req.params;
    try {
        const task = await Scan.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ error: '找不到指定的任務。'});
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
