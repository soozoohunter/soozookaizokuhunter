const { File, User, sequelize } = require('../models'); // Import sequelize
const { calculateSHA256 } = require('../utils/cryptoUtils');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { generateCertificatePDF } = require('../services/pdfService'); // Import PDF service
// const queueService = require('../services/queueService'); // If you have a queue service

const CERT_DIR = path.join('/app/uploads', 'certificates');
// Ensure directory exists synchronously at startup
if (!require('fs').existsSync(CERT_DIR)) {
    require('fs').mkdirSync(CERT_DIR, { recursive: true });
}

exports.handleStep1Upload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { keywords, title, realName, phone, email } = req.body;
    
    // In a real app, you would get userId from an auth middleware (req.user.id)
    // For this public flow, we find or create the user.
    const transaction = await sequelize.transaction();
    
    try {
        let user = await User.findOne({ where: { email }, transaction });
        if (!user) {
            // For simplicity, creating a user here. In a real app, handle this flow carefully.
            user = await User.create({
                email, phone, real_name: realName, role: 'trial', password: 'tempPassword' // Use a secure way to handle passwords
            }, { transaction });
        }

        const { path: filePath, originalname, mimetype, size } = req.file;
        const fingerprint = await calculateSHA256(filePath);

        // IPFS Upload
        const fileBuffer = await fs.readFile(filePath);
        const ipfsHash = await ipfsService.saveFile(fileBuffer);
        
        // Blockchain Transaction
        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash || '');
        const txHash = txReceipt?.transactionHash || null;

        // Create File Record
        const newFile = await File.create({
            user_id: user.id,
            filename: originalname,
            title: title || originalname,
            keywords,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txHash,
            status: 'protected',
            mime_type: mimetype,
            size
        }, { transaction });

        // Generate and save PDF Certificate
        const pdfPath = path.join(CERT_DIR, `certificate_${newFile.id}.pdf`);
        await generateCertificatePDF({ user, file: newFile, title }, pdfPath);
        
        await newFile.update({ certificate_path: pdfPath }, { transaction });

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
