const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { File, Scan, UsageRecord, User, sequelize } = require('../models');
const generateTempPassword = require('../utils/helpers').generateTempPassword;
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
const MAX_BATCH_UPLOAD = 20;

// 核心修复：统一用户处理逻辑
const findOrCreateUser = async (email, phone, realName, transaction) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();
  
  let user = await User.findOne({
    where: {
      [Op.or]: [
        { email: normalizedEmail },
        { phone: normalizedPhone }
      ]
    },
    transaction
  });

  if (!user) {
    const tempPassword = generateTempPassword();
    user = await User.create({
      email: normalizedEmail,
      phone: normalizedPhone,
      real_name: realName.trim(),
      password: await bcrypt.hash(tempPassword, 10),
      role: 'trial',
      status: 'active'
    }, { transaction });
    
    logger.info(`[User] Created new trial user: ${normalizedEmail}`);
  }
  
  return user;
};

// 文件处理逻辑（保持不变）
const handleFileUpload = async (file, userId, body, transaction) => {
  const { path: tempPath, mimetype } = file;
  const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const { title, keywords } = body;

  const fileBuffer = fs.readFileSync(tempPath);
  const fingerprint = fingerprintService.sha256(fileBuffer);

  // Check if file already exists
  let existingFile;
  try {
    existingFile = await File.findOne({
      where: { fingerprint },
      transaction
    });
  } catch (findError) {
    logger.error('[File Find Error]', {
      error: findError.message,
      sql: findError.sql,
      fingerprint
    });
    throw findError;
  }
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

  try {
    const newScan = await Scan.create({
      file_id: newFile.id,
      user_id: userId,
      status: 'pending'
    }, { transaction });

    await UsageRecord.create({ user_id: userId, feature_code: 'scan' }, { transaction });

    await queueService.sendToQueue({
      taskId: newScan.id,
      fileId: newFile.id,
      userId: userId,
      keywords: newFile.keywords,
    });

    logger.info(`[File Upload] Protected and dispatched scan task ${newScan.id} for file ${newFile.id}`);
  } catch (scanError) {
    logger.error('[Scan Creation Failed]', {
      error: scanError.message,
      stack: scanError.stack,
      fileId: newFile.id,
      userId: userId,
      sql: scanError.sql
    });
    throw scanError;
  }

  return newFile;
};

router.post('/step1', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未提供檔案。' });
  
  const { email, phone, realName } = req.body;
  if (!email || !phone || !realName) {
    return res.status(400).json({ error: '姓名、電話、Email 為必填項。' });
  }

  const transaction = await sequelize.transaction();
  
  try {
    const user = await findOrCreateUser(email, phone, realName, transaction);
    const newFile = await handleFileUpload(req.file, user.id, req.body, transaction);
    
    await transaction.commit();
    
    res.status(201).json({
      message: '試用憑證已生成',
      file: {
        id: newFile.id,
        filename: newFile.filename,
        thumbnail_path: newFile.thumbnail_path
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    await transaction.rollback();
    
    // 增强错误日志
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      ...(error.sql && { sql: error.sql }),
      ...(error.errors && {
        validationErrors: error.errors.map(e => ({
          field: e.path,
          message: e.message,
          value: e.value
        }))
      })
    };
    
    logger.error('[Protect Step1] Failed:', errorDetails);
    
    const status = error.status || 500;
    const message = error.message || '處理試用檔案時發生內部錯誤。';
    
    res.status(status).json({ error: message });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) logger.error('[Cleanup] Failed to delete temp file:', err);
      });
    }
  }
});

// 批量保護路由
router.post('/batch-protect', upload.array('files', MAX_BATCH_UPLOAD), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: '未提供任何檔案。' });

  const results = [];

  for (const file of req.files) {
    const transaction = await sequelize.transaction();
    try {
      const newFile = await handleFileUpload(file, req.user.id, {
        title: file.originalname,
        keywords: ''
      }, transaction);
      await transaction.commit();
      results.push({
        filename: newFile.filename,
        status: 'success',
        fileId: newFile.id,
        thumbnailUrl: newFile.thumbnail_path
      });
    } catch (error) {
      await transaction.rollback();
      const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
      results.push({
        filename: originalname,
        status: 'failed',
        reason: error.message
      });
    } finally {
      if (file?.path) fs.unlink(file.path, () => {});
    }
  }

  res.status(207).json({
    message: '批量保護任務已完成。',
    results
  });
});

module.exports = router;
