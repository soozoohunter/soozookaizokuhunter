const { File, User, sequelize } = require('../models');
const { calculateSHA256 } = require('../utils/cryptoUtils');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
// const queueService = require('../services/queueService');

const CERT_DIR = path.join('/app/uploads', 'certificates');

exports.handleStep1Upload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { keywords } = req.body;
    const userId = req.user ? req.user.id : 1;
    const transaction = await sequelize.transaction();

    try {
        const { path: filePath, originalname: filename, mimetype, size } = req.file;

        const fingerprint = await calculateSHA256(filePath);

        const existingFile = await File.findOne({ where: { fingerprint }, transaction });
        if (existingFile) {
            await transaction.rollback();
            await fs.unlink(filePath);
            return res.status(409).json({ message: 'This file has already been protected.' });
        }

        let ipfsHash = null;
        try {
            const fileBuffer = await fs.readFile(filePath);
            ipfsHash = await ipfsService.saveFile(fileBuffer);
        } catch (ipfsError) {
            logger.error(`[IPFS Service] Failed to upload to IPFS for file ${filename}: ${ipfsError.message}`);
        }

        let txHash = null;
        try {
            const txReceipt = await chain.storeRecord(fingerprint, ipfsHash || '');
            txHash = txReceipt?.transactionHash || null;
        } catch (chainError) {
            logger.error(`[Blockchain Service] Failed to store record on-chain for file ${filename}: ${chainError.message}`);
        }

        const newFile = await File.create({
            user_id: userId,
            filename,
            keywords: keywords || null,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txHash,
            status: 'protected',
            mime_type: mimetype,
            size
        }, { transaction });

        logger.info(`[File Upload] Successfully created file record with id: ${newFile.id}`);

        // await queueService.sendTask({ ... });

        await transaction.commit();

        res.status(201).json({
            message: 'File successfully protected.',
            file: {
                id: newFile.id,
                filename: newFile.filename,
                fingerprint: newFile.fingerprint
            },
            scanId: `scan-${newFile.id}`
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
