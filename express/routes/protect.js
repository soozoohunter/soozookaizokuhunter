// express/routes/protect.js
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const flatted = require('flatted'); // Added for safe JSON serialization
const { File } = require('../models');
const logger = require('../utils/logger');
const { storeRecord } = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const milvus = require('../services/milvus');
const scanner = require('../services/scanner.service');

const router = express.Router();
// 確保臨時上傳目錄存在
const tempDir = path.join(__dirname, '../../../uploads/temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}
const upload = multer({ dest: tempDir });

const getFileFingerprint = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', err => reject(err));
    });
};

router.post('/step1', upload.any(), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        logger.warn('[Step 1] No image file provided.');
        return res.status(400).json({ error: 'No image file provided.' });
    }

    const imageFile = req.files[0];
    const userId = req.user ? req.user.id : 1; // 假設未登入用戶 ID 為 1
    const tempPath = imageFile.path;
    const originalFilename = imageFile.originalname;

    try {
        const fingerprint = await getFileFingerprint(tempPath);
        const existingFile = await File.findOne({ where: { fingerprint } });
        if (existingFile) {
            logger.warn(`[Step 1] Conflict: File with fingerprint ${fingerprint} already exists.`);
            return res.status(409).json({ message: 'This image has already been protected.', error: 'Conflict', file: existingFile });
        }

        const fileBuffer = fs.readFileSync(tempPath);
        const ipfsHash = await ipfsService.saveFile(fileBuffer);
        if (!ipfsHash) throw new Error('Failed to save file to IPFS.');
        logger.info(`[Step 1] File saved to IPFS with hash: ${ipfsHash}`);

        const txResult = await storeRecord(fingerprint, ipfsHash);
        if (!txResult || !txResult.transactionHash) throw new Error('Failed to get transaction hash from blockchain service.');
        logger.info(`[Step 1] File record stored on blockchain with txHash: ${txResult.transactionHash}`);

        const newFile = await File.create({
            user_id: userId,
            filename: originalFilename,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txResult.transactionHash,
            status: 'protected',
        });

        await milvus.indexImage(tempPath, newFile.id.toString());
        logger.info(`[Step 1] Milvus successfully indexed fileId: ${newFile.id}`);

        res.status(201).json({ message: 'File protected successfully!', file: newFile });
    } catch (error) {
        logger.error('[Step 1] An error occurred:', { message: error.message, stack: error.stack });
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } finally {
        fs.unlink(tempPath, (err) => {
            if (err) logger.error(`[Step 1] Failed to delete temp file ${tempPath}:`, err);
        });
    }
});

// Dynamic watermark image view
router.get('/view/:fileId', async (req, res) => {
    const userEmail = req.user ? req.user.email : 'anonymous@example.com';
    const userIp = req.ip;

    try {
        const file = await File.findByPk(req.params.fileId);
        if (!file) return res.status(404).send('File not found');

        const originalImageBuffer = await ipfsService.getFile(file.ipfs_hash);
        if (!originalImageBuffer) return res.status(500).send('Could not retrieve image from IPFS');

        const watermarkText = `Protected by suzookaizokuhunter.com\nUser: ${userEmail}\nIP: ${userIp}\nTime: ${new Date().toISOString()}`;
        const watermarkedBuffer = await sharp(originalImageBuffer)
            .composite([
                {
                    input: Buffer.from(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200">
                            <style>.title { fill: rgba(255, 255, 255, 0.3); font-size: 20px; font-family: Arial, sans-serif; }</style>
                            <text x="50%" y="50%" text-anchor="middle" class="title">${watermarkText}</text>
                        </svg>`
                    ),
                    tile: true,
                    gravity: 'center'
                }
            ])
            .jpeg({ quality: 90 })
            .toBuffer();

        res.set('Content-Type', 'image/jpeg');
        res.send(watermarkedBuffer);
    } catch (error) {
        logger.error(`[GET /view] Failed to generate watermarked image for fileId ${req.params.fileId}:`, error);
        res.status(500).send('Error generating protected image.');
    }
});

router.post('/step2', async (req, res) => {
    const { fileId } = req.body;
    if (!fileId) {
        logger.warn('[Step 2] "fileId" is required but not provided.');
        return res.status(400).json({ error: 'fileId is required.' });
    }

    try {
        const file = await File.findByPk(fileId);
        if (!file) {
            logger.warn(`[Step 2] File not found for fileId: ${fileId}`);
            return res.status(404).json({ error: 'File not found.' });
        }

        logger.info(`[Step 2] Starting full scan for fileId: ${fileId}`);
        const imageBuffer = await ipfsService.getFile(file.ipfs_hash);
        if (!imageBuffer) {
            logger.error(`[Step 2] Failed to retrieve image from IPFS for fileId: ${fileId} with hash: ${file.ipfs_hash}`);
            return res.status(500).json({ error: 'Failed to retrieve image from IPFS.' });
        }

        const scanResults = await scanner.performFullScan({ buffer: imageBuffer, keyword: file.filename });

        file.status = 'scanned';
        file.resultJson = scanResults;
        await file.save();

        logger.info(`[Step 2] Scan complete for fileId: ${fileId}.`);

        // Use flatted to safely serialize complex objects that might have circular references
        const safeJsonString = flatted.stringify({
            message: 'Scan completed successfully.',
            results: scanResults,
        });
        res.set('Content-Type', 'application/json');
        res.status(200).send(safeJsonString);

    } catch (error) {
        logger.error(`[Step 2] Scan process failed for fileId ${fileId}:`, { message: error.message, stack: error.stack });
        // Ensure error is serialized safely
        const safeErrorString = flatted.stringify({
            message: 'An internal error occurred during the scan process.',
            error: error.message,
        });
        res.set('Content-Type', 'application/json');
        res.status(500).send(safeErrorString);
    }
});

module.exports = router;
