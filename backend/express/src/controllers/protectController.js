const { File, Scan, User, sequelize } = require('../models');
const { calculateSHA256 } = require('../utils/cryptoUtils');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { generateCertificatePDF } = require('../services/pdfService');
const queueService = require('../services/queue.service');

const CERT_DIR = path.join('/app/uploads', 'certificates');
if (!require('fs').existsSync(CERT_DIR)) {
    require('fs').mkdirSync(CERT_DIR, { recursive: true });
}

exports.handleStep1Upload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { keywords, title, realName, phone, email } = req.body;
    const transaction = await sequelize.transaction();

    try {
        let user = await User.findOne({ where: { email }, transaction });
        if (!user) {
            user = await User.findByPk(1, { transaction });
            if (!user) throw new Error("Default user with ID 1 not found.");
            logger.warn(`User with email ${email} not found. Defaulting to user ID 1.`);
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
            logger.error(`IPFS upload failed: ${err.message}`); return null;
        });

        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash || '').catch(err => {
            logger.error(`Blockchain transaction failed: ${err.message}`); return null;
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
            size: parseInt(size, 10)
        }, { transaction });

        const pdfPath = path.join(CERT_DIR, `certificate_${newFile.id}.pdf`);
        await generateCertificatePDF({ user, file: newFile, title }, pdfPath);
        await newFile.update({ certificate_path: pdfPath }, { transaction });

        const newScan = await Scan.create({
            file_id: newFile.id,
            user_id: user.id,
            status: 'pending'
        }, { transaction });

        await queueService.sendToQueue({
            scanId: newScan.id,
            fileId: newFile.id,
            ipfsHash: newFile.ipfs_hash,
            fingerprint: newFile.fingerprint,
            keywords: newFile.keywords
        });

        logger.info(`[File Upload] Protected file ${newFile.id} and dispatched scan task ${newScan.id}.`);
        await transaction.commit();

        res.status(201).json({
            message: "File successfully protected and certificate generated.",
            file: {
                id: newFile.id,
                filename: newFile.filename,
                fingerprint: newFile.fingerprint,
                ipfsHash: newFile.ipfs_hash,
                txHash: newFile.tx_hash
            },
            scanId: newScan.id
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
