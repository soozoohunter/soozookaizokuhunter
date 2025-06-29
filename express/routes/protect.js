// express/routes/protect.js (More Robust Version)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const { User, File } = require('../models');

const chain = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const scannerService = require('../services/scanner.service');
const fingerprintService = require('../services/fingerprintService');
const vectorSearchService = require('../services/vectorSearch');
const { generateCertificatePDF, generateScanPDFWithMatches } = require('../services/pdf.service.js');

const router = express.Router();

const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');
const REPORTS_DIR = path.join(UPLOAD_BASE_DIR, 'reports');
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');

[REPORTS_DIR, TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const upload = multer({
    dest: TEMP_DIR,
    limits: { fileSize: 100 * 1024 * 1024 }
});

// This part seems fine and doesn't need changes.
router.post('/step1', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '未提供檔案。' });
    }

    const { realName, birthDate, phone, address, email, title, keywords } = req.body;
    const { path: tempPath, originalname, mimetype } = req.file;
    let fileBuffer;

    try {
        fileBuffer = fs.readFileSync(tempPath);

        let user;
        if (req.user?.id) {
            user = await User.findByPk(req.user.id);
        } else if (email || phone) {
            const whereConditions = [];
            if (email) whereConditions.push({ email });
            if (phone) whereConditions.push({ phone });
            user = await User.findOne({ where: { [Op.or]: whereConditions } });
        }

        if (!user) {
            if (!realName || !email) {
                fs.unlinkSync(tempPath);
                return res.status(400).json({ error: '對於新用戶，姓名和電子郵件為必填項。'});
            }
            user = await User.create({ name: realName, dob: birthDate, phone, address, email });
            logger.info(`[Step 1] New user created: ${user.email} (ID: ${user.id})`);
        }

        const fingerprint = fingerprintService.sha256(fileBuffer);
        const existingFile = await File.findOne({ where: { fingerprint } });
        if (existingFile) {
            logger.warn(`[Step 1] Conflict: File with fingerprint ${fingerprint} already exists.`);
            fs.unlinkSync(tempPath);
            return res.status(409).json({
                message: '此圖片先前已被保護。',
                error: 'Conflict',
                file: existingFile
            });
        }

        const ipfsHash = await ipfsService.saveFile(fileBuffer);
        if (!ipfsHash) throw new Error('Failed to save file to IPFS.');
        logger.info(`[Step 1] File saved to IPFS, CID: ${ipfsHash}`);

        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);
        const txHash = txReceipt.transactionHash;
        logger.info(`[Step 1] Record stored on blockchain, TxHash: ${txHash}`);

        const newFile = await File.create({
            user_id: user.id,
            filename: originalname,
            title,
            keywords,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txHash,
            status: 'protected',
            mime_type: mimetype,
        });
        logger.info(`[Step 1] File record saved to database, File ID: ${newFile.id}`);

        setImmediate(async () => {
            try {
                await vectorSearchService.indexImage(fileBuffer, newFile.id.toString());
                logger.info(`[Background] Vector indexing complete for File ID: ${newFile.id}`);
            } catch (err) {
                logger.error(`[Background] Vector indexing failed for File ID: ${newFile.id}. See previous error log for details.`);
            }

            try {
                const pdfPath = await generateCertificatePDF({ fileId: newFile.id, user, file: newFile });
                logger.info(`[Background] Certificate PDF generated for File ID: ${newFile.id} at ${pdfPath}`);
            } catch (err) {
                logger.error(`[Background] Certificate PDF generation failed for File ID: ${newFile.id}`, err);
            }
        });

        res.status(201).json({ message: '檔案保護成功！', file: newFile });

    } catch (error) {
        logger.error('[Step 1] An error occurred during the protection process:', error);
        res.status(500).json({ message: '伺服器內部錯誤', error: error.message });
    } finally {
        fs.unlink(tempPath, err => {
            if (err) logger.warn(`[Step 1] Failed to delete temp file ${tempPath}:`, err);
        });
    }
});


const handleScanRequest = async (req, res) => {
    const fileId = req.params.fileId || req.body.fileId;
    const routeName = `[Scan Route ${req.path}]`;

    if (!fileId) {
        return res.status(400).json({ error: 'fileId is required' });
    }
    logger.info(`${routeName} Received scan request for File ID: ${fileId}`);

    try {
        const file = await File.findByPk(fileId);
        if (!file) {
            return res.status(404).json({ error: '找不到指定的檔案紀錄。' });
        }
        logger.info(`${routeName} File record found. Filename: ${file.filename}`);

        const imageBuffer = await ipfsService.getFile(file.ipfs_hash);
        
        // **FIX**: Add a check here to ensure imageBuffer is valid before proceeding
        if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
            logger.error(`${routeName} Failed to retrieve a valid image buffer from IPFS for CID: ${file.ipfs_hash}`);
            return res.status(500).json({ error: '從 IPFS 讀取有效圖片失敗。' });
        }
        logger.info(`${routeName} Image retrieved from IPFS successfully.`);

        logger.info(`${routeName} Performing full scan...`);
        
        // **FIX**: Add debug log to inspect the object being passed
        const scanOptions = {
            buffer: imageBuffer,
            originalFingerprint: file.fingerprint,
        };
        logger.info(`${routeName} Calling performFullScan with options:`, { 
            hasBuffer: !!scanOptions.buffer, 
            bufferLength: scanOptions.buffer?.length, 
            hasFingerprint: !!scanOptions.originalFingerprint 
        });

        const scanResults = await scannerService.performFullScan(scanOptions);
        logger.info(`${routeName} Full scan complete.`);

        logger.info(`${routeName} Performing internal vector search...`);
        const vectorMatches = await vectorSearchService.searchLocalImage(imageBuffer);
        logger.info(`${routeName} Internal vector search found ${vectorMatches?.results?.length || 0} similar results.`);

        const finalResults = { scan: scanResults, internalMatches: vectorMatches };
        
        file.status = 'scanned';
        file.resultJson = JSON.stringify(finalResults);
        await file.save();
        logger.info(`${routeName} Scan results saved to database.`);

        const reportFileName = `report_${fileId}_${Date.now()}.pdf`;
        const reportPath = path.join(REPORTS_DIR, reportFileName);
        const reportUrl = `${process.env.PUBLIC_HOST}/uploads/reports/${reportFileName}`;

        const suspiciousLinks = [
            ...(scanResults.reverseImageSearch?.googleVision?.links || []),
            ...((scanResults.reverseImageSearch?.tineye?.matches || []).flatMap(m => m.backlinks?.length ? m.backlinks : [m.url]))
        ].filter(Boolean);

        setImmediate(async () => {
            try {
                await generateScanPDFWithMatches({
                    file: file,
                    suspiciousLinks,
                    matchedImages: scanResults.verifiedMatches || [],
                }, reportPath);
                await file.update({ report_url: reportUrl });
                logger.info(`${routeName} Report generated and URL updated for File ID: ${fileId}`);
            } catch (err) {
                logger.error(`${routeName} Failed to generate or save report for File ID: ${fileId}`, err);
            }
        });

        res.status(200).json({
            message: '掃描完成',
            reportUrl: reportUrl,
            results: finalResults
        });
        logger.info(`${routeName} Successfully sent scan results to client.`);

    } catch (error) {
        logger.error(`${routeName} A critical error occurred while scanning file ID ${fileId}:`, error);
        res.status(500).json({ message: '掃描時發生內部伺服器錯誤', error: error.message });
    }
};

router.post('/step2', handleScanRequest);
router.get('/scan/:fileId', handleScanRequest);

// view route remains the same
router.get('/view/:fileId', async (req, res) => {
    // ...
});

module.exports = router;
