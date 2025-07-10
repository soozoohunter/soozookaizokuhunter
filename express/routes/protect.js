// express/routes/protect.js (v3.1 - 最終邏輯修正)
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

const handleFileUpload = async (file, userId, body, transaction) => {
    const { path: tempPath, mimetype } = file;
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const { title, keywords } = body;
    
    const fileBuffer = fs.readFileSync(tempPath);
    const fingerprint = fingerprintService.sha256(fileBuffer);
    
    const existingFile = await File.findOne({ where: { fingerprint }, transaction });
    if (existingFile) {
        throw { status: 409, message: `此檔案 (${originalname}) 先前已被保護。` };
    }

    const publicHost = process.env.PUBLIC_HOST || 'https://suzookaizokuhunter.com';
    let thumbnailUrl;

    if (mimetype && mimetype.startsWith('image/')) {
        const thumbnailFilename = `${fingerprint}_thumb.jpg`;
        const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);
        await sharp(fileBuffer).resize(300, 300, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(thumbnailPath);
        thumbnailUrl = `${publicHost}/uploads/thumbnails/${thumbnailFilename}`;
    } else {
        thumbnailUrl = `${publicHost}/video_icon.png`;
    }

    const ipfsHash = await ipfsService.saveFile(fileBuffer);
    if (!ipfsHash) throw new Error('Failed to save file to IPFS.');
    
    const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);
    
    const newFile = await File.create({
        user_id: userId,
        filename: originalname,
        title: title || originalname,
        keywords,
        fingerprint,
        ipfs_hash: ipfsHash,
        tx_hash: txReceipt?.transactionHash || null,
        status: 'protected',
        mime_type: mimetype,
        thumbnail_path: thumbnailUrl
    }, { transaction });

    await UsageRecord.create({ user_id: userId, feature_code: 'image_upload' }, { transaction });
    
    const newScan = await Scan.create({ file_id: newFile.id, user_id: userId, status: 'pending' }, { transaction });
    await UsageRecord.create({ user_id: userId, feature_code: 'scan' }, { transaction });
    
    await queueService.sendToQueue({
        taskId: newScan.id,
        fileId: newFile.id,
        userId: userId,
        keywords: newFile.keywords,
    });
    
    logger.info(`[File Upload] Protected and dispatched scan task ${newScan.id} for file ${newFile.id}`);
    return newFile;
};

router.post('/step1', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: '未提供檔案。' });
    
    const { email, phone, realName } = req.body;
    if (!email || !phone || !realName) return res.status(400).json({ error: '姓名、電話、Email 為必填項。' });

    const transaction = await sequelize.transaction();
    try {
        let user = await User.findOne({ where: { [sequelize.Op.or]: [{ email }, { phone }] }, transaction });
        
        if (!user) {
            const tempPassword = generateTempPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            user = await User.create({ ...req.body, password: hashedPassword, role: 'trial', status: 'pending' }, { transaction });
            logger.info(`Created a new trial user ${email}.`);
        }

        const newFile = await handleFileUpload(req.file, user.id, req.body, transaction);
        await transaction.commit();
        res.status(201).json({ message: '試用憑證已生成', file: newFile, user: { id: user.id, role: user.role } });

    } catch (error) {
        await transaction.rollback();
        logger.error('[Protect Step1] Failed:', error);
        res.status(error.status || 500).json({ error: error.message || '處理試用檔案時發生內部錯誤。' });
    } finally {
        if (req.file?.path) fs.unlink(req.file.path, () => {});
    }
});

router.post('/batch-protect', auth, checkQuota('image_upload'), upload.array('files', MAX_BATCH_UPLOAD), async (req, res) => {
    if (!req.files?.length) return res.status(400).json({ error: '未提供任何檔案。' });

    const results = [];
    for (const file of req.files) {
        const transaction = await sequelize.transaction();
        try {
            const newFile = await handleFileUpload(file, req.user.id, { title: file.originalname, keywords: '' }, transaction);
            await transaction.commit();
            results.push({ filename: newFile.filename, status: 'success', fileId: newFile.id, thumbnailUrl: newFile.thumbnail_path });
        } catch (error) {
            await transaction.rollback();
            const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            results.push({ filename: originalname, status: 'failed', reason: error.message });
        } finally {
            if (file?.path) fs.unlink(file.path, () => {});
        }
    }
    res.status(207).json({ message: '批量保護任務已完成。', results });
});

module.exports = router;
