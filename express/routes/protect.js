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

router.post('/step1', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }

    const userId = req.user ? req.user.id : 1;
    const tempPath = req.file.path;

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
        const ipfsResult = await ipfsService.saveFile(fileBuffer);
        const txResult = await storeRecord(fingerprint, ipfsResult.cid.toString());
        
        if (!txResult || !txResult.transactionHash) {
            throw new Error('Failed to get transaction hash from blockchain service.');
        }

        const newFile = await File.create({
            user_id: userId,
            filename: req.file.originalname,
            fingerprint: fingerprint,
            ipfs_hash: ipfsResult.cid.toString(),
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

        const imageBuffer = await ipfsService.getFile(file.ipfs_hash);
        if (!imageBuffer) {
            return res.status(500).json({ error: 'Failed to retrieve image from IPFS.' });
        }
        
        const scanResults = await scanner.performFullScan({
            buffer: imageBuffer,
            keyword: file.filename,
        });

        file.status = 'scanned';
        file.resultJson = scanResults;
        await file.save();

        logger.info(`[Step 2] Scan complete for fileId: ${fileId}.`);

        res.status(200).json({
            message: 'Scan completed.',
            results: scanResults,
        });

    } catch (error) {
        logger.error(`[Step 2] Scan process failed for fileId ${fileId}:`, error);
        res.status(500).json({ message: 'Internal Server Error during scan process.', error: error.message });
    }
});

module.exports = router;
