// express/routes/protect.js (影片處理與錯誤修正)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');
const checkQuota = require('../middleware/quotaCheck');
const { File, Scan, UsageRecord, User, sequelize } = require('../models');
const chain = require('../services/blockchainService');
const ipfsService = require('../services/ipfsService');
const fingerprintService = require('../services/fingerprintService');
const queueService = require('../services/queue.service');
const { generateTempPassword } = require('../utils/helpers');

const router = express.Router();
const UPLOAD_BASE_DIR = '/app/uploads';
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');
const THUMBNAIL_DIR = path.join(UPLOAD_BASE_DIR, 'thumbnails');

fs.mkdirSync(TEMP_DIR, { recursive: true });
fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });

const upload = multer({ dest: TEMP_DIR, limits: { fileSize: 100 * 1024 * 1024 } });
const MAX_BATCH_UPLOAD = 20;

const handleFileUpload = async (file, userId, body) => {
    const { path: tempPath, mimetype } = file;
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const { title, keywords } = body;
    
    const fileBuffer = fs.readFileSync(tempPath);
    const fingerprint = fingerprintService.sha256(fileBuffer);
    
    const existingFile = await File.findOne({ where: { fingerprint } });
    if (existingFile) {
        fs.unlinkSync(tempPath);
        throw { status: 409, message: `此檔案 (${originalname}) 先前已被保護。`, file: existingFile };
    }

    const publicHost = process.env.PUBLIC_HOST || 'https://suzookaizokuhunter.com';
    let thumbnailUrl;

    // [影片修正] 判斷檔案類型來決定如何生成縮圖
    if (mimetype.startsWith('image/')) {
        const thumbnailFilename = `${fingerprint}_thumb.jpg`;
        const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);
        await sharp(fileBuffer).resize(300, 300, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(thumbnailPath);
        thumbnailUrl = `${publicHost}/uploads/thumbnails/${thumbnailFilename}`;
    } else {
        // 如果不是圖片（例如影片），使用一個預設的圖示
        thumbnailUrl = `${publicHost}/video_icon.png`; // 假設您在 frontend/public/ 有一個 video_icon.png
    }

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
        thumbnail_path: thumbnailUrl // 儲存完整 URL
    });

    await UsageRecord.create({ user_id: userId, feature_code: 'upload' });
    
    const newScan = await Scan.create({ file_id: newFile.id, user_id: userId, status: 'pending' });
    await UsageRecord.create({ user_id: userId, feature_code: 'scan' });
    
    await queueService.sendToQueue({
        taskId: newScan.id,
        fileId: newFile.id,
        userId: userId,
        keywords: newFile.keywords, // 將關鍵字傳遞給 worker
    });
    
    logger.info(`[File Upload] Protected and dispatched scan task ${newScan.id} for file ${newFile.id}`);
    return newFile;
};

// POST /api/protect/step1 - 免費試用流程
router.post('/step1', upload.single('file'), async (req, res) => {
    // ... (此路由的其他程式碼保持不變)
    if (!req.file) {
        return res.status(400).json({ error: '未提供檔案。' });
    }

    const { realName, birthDate, phone, address, email, title, keywords, agreePolicy } = req.body;
    if (!email || !phone || !realName || !agreePolicy) {
        return res.status(400).json({ error: '姓名、電話、Email 與同意條款為必填項。' });
    }
    
    const transaction = await sequelize.transaction();
    try {
        let user = await User.findOne({ where: { email }, transaction });
        if (!user) {
            const tempPassword = generateTempPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            user = await User.create({
                email, phone, realName, birthDate, address,
                password: hashedPassword,
                role: 'trial',
                status: 'pending_verification',
            }, { transaction });
            logger.info(`Created a new trial user ${email} with temporary password.`);
        }

        const newFile = await handleFileUpload(req.file, user.id, req.body);
        
        await transaction.commit();

        res.status(201).json({
            message: '試用憑證已生成，正在啟動侵權偵測...',
            file: newFile,
            user: { id: user.id, email: user.email, role: user.role }
        });

    } catch (error) {
        await transaction.rollback();
        if (error.status) {
            return res.status(error.status).json({ error: error.message, file: error.file });
        }
        logger.error('[Protect Step1] Failed to process trial file:', error);
        res.status(500).json({ error: '處理試用檔案時發生內部錯誤。' });
    } finally {
        if (req.file?.path) {
            fs.unlink(req.file.path, (err) => {
                if(err) logger.error(`Failed to delete temp file: ${req.file.path}`, err);
            });
        }
    }
});


// POST /api/protect/batch-protect - 已登入會員的批量上傳
router.post('/batch-protect', auth, checkQuota('upload'), upload.array('files', MAX_BATCH_UPLOAD), async (req, res) => {
    // ... (此路由的其他程式碼保持不變)
    if (!req.files || !req.files.length) {
        return res.status(400).json({ error: '未提供任何檔案。' });
    }

    const results = [];
    for (const file of req.files) {
        try {
            // 對於批量上傳，我們假設沒有額外的 title 和 keywords
            const newFile = await handleFileUpload(file, req.user.id, { title: file.originalname, keywords: '' });
            results.push({ 
                filename: newFile.filename, 
                status: 'success', 
                fileId: newFile.id,
                thumbnailUrl: newFile.thumbnail_path
            });
        } catch (error) {
            const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            results.push({ filename: originalname, status: 'failed', reason: error.message });
        } finally {
            if (file?.path) {
                fs.unlink(file.path, () => {});
            }
        }
    }
    res.status(207).json({ message: '批量保護任務已完成。', results });
});

module.exports = router;
