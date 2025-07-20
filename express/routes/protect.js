// express/routes/protect.js (完整修正版)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
// [關鍵修正] 移除所有對 ScanTask 的引用，回歸單純的 Scan 模型
const { File, Scan, UsageRecord, User, sequelize } = require('../models');
const { generateTempPassword } = require('../utils/helpers');
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const queueService = require('../services/queue.service');

const router = express.Router();
const UPLOAD_BASE_DIR = '/app/uploads';
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');
const THUMBNAIL_DIR = path.join(UPLOAD_BASE_DIR, 'thumbnails');

// 确保目录存在
[UPLOAD_BASE_DIR, TEMP_DIR, THUMBNAIL_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const upload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// 统一用户处理逻辑
const findOrCreateUser = async (email, phone, realName, transaction) => {
  const normalizedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ where: { email: normalizedEmail }, transaction });

  if (user) {
    logger.info(`[User] Found existing user: ${user.email} (ID: ${user.id})`);
  } else {
    const tempPassword = generateTempPassword();
    user = await User.create({
      email: normalizedEmail,
      phone: phone.trim(),
      real_name: realName.trim(),
      password: await bcrypt.hash(tempPassword, 10),
      role: 'trial',
      status: 'active'
    }, { transaction });
    logger.info(`[User] Created new trial user: ${normalizedEmail} (ID: ${user.id})`);
  }
  return user;
};

// 檔案處理與任務派發邏輯
const handleFileUpload = async (file, userId, body, transaction) => {
  const { path: tempPath, mimetype } = file;
  const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const { title, keywords } = body;

  const fileBuffer = fs.readFileSync(tempPath);
  const fingerprint = fingerprintService.sha256(fileBuffer);
  
  const publicHost = process.env.PUBLIC_HOST || 'https://suzookaizokuhunter.com';
  let thumbnailUrl = `${publicHost}/default_thumbnail.png`; // Default thumbnail

  if (mimetype && mimetype.startsWith('image/')) {
      const thumbnailFilename = `${fingerprint}_thumb.webp`;
      const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);
      await sharp(fileBuffer).resize(300, 300, { fit: 'inside' }).webp({ quality: 80 }).toFile(thumbnailPath);
      thumbnailUrl = `${publicHost}/uploads/thumbnails/${thumbnailFilename}`;
  }

  const ipfsHash = await ipfsService.saveFile(fileBuffer);
  if (!ipfsHash) throw new Error('Failed to save file to IPFS.');

  const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);

  let newFile;
  try {
    newFile = await File.create({
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
    logger.info(`[File Upload] Created file record with id: ${newFile.id}`);
  } catch (err) {
    logger.error(`[File Upload] Failed to create file record: ${err.message}`);
    throw err;
  }

  await UsageRecord.create({ user_id: userId, feature_code: 'image_upload' }, { transaction });

  // [關鍵修正] 只建立一個 Scan 紀錄
  const newScan = await Scan.create({
    file_id: newFile.id,
    user_id: userId,
    status: 'pending'
  }, { transaction });

  await UsageRecord.create({ user_id: userId, feature_code: 'scan' }, { transaction });

  // [關鍵修正] 簡化佇列訊息，只傳遞 newScan.id (作為 scanId)
  await queueService.sendToQueue({
    scanId: newScan.id, // Worker 將使用此 ID 來更新 Scan 紀錄
    fileId: newFile.id,
    userId: userId,
    ipfsHash: newFile.ipfs_hash,
    fingerprint: newFile.fingerprint,
    keywords: newFile.keywords
  });

  logger.info(`[File Upload] Protected file ${newFile.id} and dispatched scan task ${newScan.id}.`);
  
  // [關鍵修正] 簡化回傳值
  return { newFile, scanId: newScan.id };
};

// 核心路由: Step 1
router.post('/step1', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未提供檔案。' });
  }
  
  const { email, phone, realName, title } = req.body;
  if (!email || !phone || !realName || !title) {
    return res.status(400).json({ error: '姓名、電話、Email 與作品標題為必填項。' });
  }

  const transaction = await sequelize.transaction();
  
  try {
    const user = await findOrCreateUser(email, phone, realName, transaction);
    const { newFile, scanId } = await handleFileUpload(req.file, user.id, req.body, transaction);
    
    await transaction.commit();
    
    res.status(201).json({
      message: '憑證已生成，掃描任務已派發',
      file: {
        id: newFile.id,
        filename: newFile.filename,
        thumbnail_path: newFile.thumbnail_path,
        ipfsHash: newFile.ipfs_hash,
        txHash: newFile.tx_hash,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      scanId: scanId
    });
  } catch (error) {
    await transaction.rollback();
    
    const status = error.status || 500;
    const message = error.message || '處理檔案時發生內部錯誤。';
    
    logger.error('[Protect Step1] Failed:', { status, message, stack: error.stack });
    
    res.status(status).json({ error: message });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) logger.error('[Cleanup] Failed to delete temp file:', err);
      });
    }
  }
});

module.exports = router;
