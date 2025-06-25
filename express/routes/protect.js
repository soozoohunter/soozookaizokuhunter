const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { File } = require('../models');
const logger = require('../utils/logger');
const { storeRecord } = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const milvus = require('../services/milvus');
const scanner = require('../services/scanner.service');

const router = express.Router();

// Multer is configured for temporary storage. We'll accept any field name to
// ensure compatibility with various client implementations.
const upload = multer({ dest: path.join(__dirname, '../../../uploads/temp') });

const getFileFingerprint = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', err => reject(err));
    });
};

// Accept any file field and process the first uploaded file
router.post('/step1', upload.any(), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image file provided.' });
    }

    const imageFile = req.files[0];
    const userId = req.user ? req.user.id : 1; // Placeholder for auth
    const tempPath = imageFile.path;
    const originalFilename = imageFile.originalname;

    try {
        const fingerprint = await getFileFingerprint(tempPath);

        const existingFile = await File.findOne({ where: { fingerprint } });
        if (existingFile) {
            logger.warn(`[Step 1] Duplicate file upload detected. Fingerprint: ${fingerprint.slice(0, 15)}...`);
            return res.status(409).json({
                message: 'This image has already been protected.',
                error: 'Conflict',
                file: existingFile
            });
        }

        const fileBuffer = fs.readFileSync(tempPath);
        const ipfsHash = await ipfsService.saveFile(fileBuffer);
        const txResult = await storeRecord(fingerprint, ipfsHash);
        
        if (!txResult || !txResult.transactionHash) {
            throw new Error('Failed to get transaction hash from blockchain service.');
        }

        const newFile = await File.create({
            user_id: userId,
            filename: originalFilename,
            fingerprint: fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txResult.transactionHash,
            status: 'protected',
        });

        await milvus.indexImage(tempPath, newFile.id.toString());
        logger.info(`[Step 1] Milvus successfully indexed fileId: ${newFile.id}`);

        res.status(201).json({
            message: 'File protected successfully!',
            file: newFile
        });
    } catch (error) {
        logger.error('[Step 1] An error occurred:', error);
        // Differentiate Multer errors from other failures for clearer feedback
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: 'File upload error', error: error.message });
        }
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } finally {
        fs.unlink(tempPath, (err) => {
            if (err) logger.error(`[Step 1] Failed to delete temp file ${tempPath}:`, err);
        });
    }
});

router.post('/step2', async (req, res) => {
    const { fileId } = req.body;
    if (!fileId) {
        return res.status(400).json({ error: 'fileId is required.' });
    }

    try {
        const file = await File.findByPk(fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found.' });
        }

        // ipfsService currently lacks a getFile function. Scanning logic will
        // be implemented once retrieval from IPFS is available.

        logger.info(`[Step 2] Scan complete for fileId: ${fileId}.`);

        res.status(200).json({
            message:
                'Scan completed. (Note: Actual scanning logic is pending implementation of ipfsService.getFile)',
            // results: scanResults,
        });

    } catch (error) {
        logger.error(`[Step 2] Scan process failed for fileId ${fileId}:`, error);
        res.status(500).json({ message: 'Internal Server Error during scan process.', error: error.message });
    }
});

module.exports = router;
