// backend/src/controllers/protectController.js
const { File, User, sequelize } = require('../models');
const { calculateSHA256 } = require('../utils/cryptoUtils');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
// const queueService = require('../services/queueService'); // Uncomment if you have this service

exports.handleStep1Upload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { keywords, title, realName, phone, email } = req.body;
    const transaction = await sequelize.transaction();

    try {
        let user = await User.findOne({ where: { email }, transaction });
        if (!user) {
            // This is a placeholder for user creation. 
            // In a real app, handle temporary users or require login.
            user = { id: 1 }; // Fallback to user 1 for now to prevent crashes
            logger.warn(`User with email ${email} not found. Defaulting to user ID 1 for this transaction.`);
        }

        const { path: filePath, originalname, mimetype, size } = req.file;
        const fingerprint = await calculateSHA256(filePath);

        const existingFile = await File.findOne({ where: { fingerprint }, transaction });
        if (existingFile) {
            await transaction.rollback();
            await fs.unlink(filePath);
            return res.status(409).json({ message: 'This file has already been protected.' });
        }

        const fileBuffer = await fs.readFile(filePath);
        const ipfsHash = await ipfsService.saveFile(fileBuffer).catch(err => {
            logger.error(`IPFS upload failed: ${err.message}`);
            return null; // Gracefully handle IPFS failure
        });

        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash || '').catch(err => {
            logger.error(`Blockchain transaction failed: ${err.message}`);
            return null; // Gracefully handle blockchain failure
        });
        
        const txHash = txReceipt?.transactionHash || null;

        const newFile = await File.create({
            user_id: user.id,
            filename: originalname,
            title: title || originalname,
            keywords: keywords || null,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txHash,
            status: 'protected',
            mime_type: mimetype,
            size
        }, { transaction });

        logger.info(`[File Upload] Successfully created file record with id: ${newFile.id}`);
        
        // await queueService.sendTask({ scanId, ... });
        
        await transaction.commit();

        res.status(201).json({
            message: "File successfully protected.",
            file: {
                id: newFile.id,
                filename: newFile.filename,
                fingerprint: newFile.fingerprint,
                ipfsHash: newFile.ipfs_hash,
                txHash: newFile.tx_hash
            },
        });

    } catch (error) {
        await transaction.rollback();
        logger.error(`[Protect Step1] Critical error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error during file processing.' });
    } finally {
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(err => logger.error(`[Cleanup] Failed to delete temp file: ${req.file.path}`, err));
        }
    }
};
