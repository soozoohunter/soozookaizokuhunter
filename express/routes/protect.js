// express/routes/protect.js (最終邏輯修正版)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
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
// 確保上傳路徑在容器內是絕對路徑 /app/uploads
const UPLOAD_BASE_DIR = '/app/uploads';
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');
const THUMBNAIL_DIR = path.join(UPLOAD_BASE_DIR, 'thumbnails');

// 確保目錄存在
fs.mkdirSync(TEMP_DIR, { recursive: true });
fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });

const upload = multer({ dest: TEMP_DIR, limits: { fileSize: 100 * 1024 * 1024 } });
const MAX_BATCH_UPLOAD = 20;

// [核心] 抽取出的、可重用的單一檔案處理函式
const handleFileUpload = async (file, userId, body) => {
    const { path: tempPath, mimetype } = file;
    // 處理中文檔名
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const { title, keywords } = body;
    
    const fileBuffer = fs.readFileSync(tempPath);
    const fingerprint = fingerprintService.sha256(fileBuffer);
    
    // 檢查檔案是否已被保護
    const existingFile = await File.findOne({ where: { fingerprint } });
    if (existingFile) {
        fs.unlinkSync(tempPath); // 刪除暫存檔
        throw { status: 409, message: `此檔案 (${originalname}) 先前已被保護。`, file: existingFile };
    }

    // 生成縮圖
    const thumbnailFilename = `${fingerprint}_thumb.jpg`;
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);
    await sharp(fileBuffer).resize(300, 300, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(thumbnailPath);

    // 依序上傳到 IPFS 並上鏈
    const ipfsHash = await ipfsService.saveFile(fileBuffer);
    if (!ipfsHash) {
        throw new Error('Failed to save file to IPFS.');
    }
    
    const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);
    
    // https://en.wiktionary.org/wiki/%E4%BF%AE%E6%AD%A3 產生一個完整的、公開的縮圖 URL
    const publicHost = process.env.PUBLIC_HOST || 'https://suzookaizokuhunter.com';
    const thumbnailUrl = `${publicHost}/uploads/thumbnails/${thumbnailFilename}`;

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
        thumbnail_path: thumbnailUrl // 直接儲存完整 URL
    });

    // 記錄用量
    await UsageRecord.create({ user_id: userId, feature_code: 'image_upload' });
    
    // 建立掃描任務並發送到佇列
    const newScan = await Scan.create({ file_id: newFile.id, user_id: userId, status: 'pending' });
    await UsageRecord.create({ user_id: userId, feature_code: 'scan' });
    
    await queueService.sendToQueue({
        taskId: newScan.id,
        fileId: newFile.id,
        userId: userId,
    });
    
    logger.info(`[File Upload] Protected and dispatched scan task ${newScan.id} for file ${newFile.id}`);
    return newFile;
};

// POST /api/protect/step1 - 免費試用流程
router.post('/step1', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '未提供檔案。' });
    }

    const { realName, birthDate, phone, address, email, title, keywords, agreePolicy } = req.body;
    if (!email || !phone || !realName || !agreePolicy) {
        return res.status(400).json({ error: '姓名、電話、Email 與同意條款為必填項。' });
    }
    
    const transaction = await sequelize.transaction();
    try {
        // 尋找或建立一個「試用者」帳號
        let user = await User.findOne({ where: { email }, transaction });
        if (!user) {
            const tempPassword = generateTempPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            user = await User.create({
                email, phone, realName, birthDate, address,
                password: hashedPassword,
                role: 'trial', // 標記為試用者
                status: 'pending_verification',
            }, { transaction });
            // TODO: 您可以在此處發送一封包含臨時密碼的郵件
            logger.info(`Created a new trial user ${email} with temporary password.`);
        }

        // 使用 handleFileUpload 處理檔案
        const newFile = await handleFileUpload(req.file, user.id, req.body);
        
        await transaction.commit();

        // 回傳包含完整 URL 的檔案資訊
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
        // 無論成功失敗，都刪除 multer 產生的暫存檔
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if(err) logger.error(`Failed to delete temp file: ${req.file.path}`, err);
            });
        }
    }
});


// POST /api/protect/batch-protect - 已登入會員的批量上傳
router.post('/batch-protect', auth, checkQuota('image_upload'), upload.array('files', MAX_BATCH_UPLOAD), async (req, res) => {
    if (!req.files || !req.files.length) {
        return res.status(400).json({ error: '未提供任何檔案。' });
    }

    const results = [];
    for (const file of req.files) {
        try {
            const newFile = await handleFileUpload(file, req.user.id, {});
            results.push({ 
                filename: newFile.filename, 
                status: 'success', 
                fileId: newFile.id,
                thumbnailUrl: newFile.thumbnail_path // 將 URL 回傳
            });
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

module.exports = router;
