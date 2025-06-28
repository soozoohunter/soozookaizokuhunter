// express/routes/protect.js (Final Corrected & Robust Version)
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

router.post('/step1', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '未提供檔案。' });
    }

    const { realName, birthDate, phone, address, email, title, keywords } = req.body;
    const { path: tempPath, originalname, mimetype } = req.file;
    const userIdFromToken = req.user ? req.user.id : null;

    try {
        const fileBuffer = fs.readFileSync(tempPath);

        let user;
        if (userIdFromToken) {
            user = await User.findByPk(userIdFromToken);
        } else if (email || phone) {
            const whereConditions = [];
            if (email) whereConditions.push({ email });
            if (phone) whereConditions.push({ phone });
            user = await User.findOne({ where: { [Op.or]: whereConditions } });
        }

        if (!user) {
            if (!realName || !email) {
                return res.status(400).json({ error: '對於新用戶，姓名和電子郵件為必填項。'});
            }
            user = await User.create({ name: realName, dob: birthDate, phone, address, email });
            logger.info(`[Step 1] New user created: ${user.email} (ID: ${user.id})`);
        }

        // Calculate SHA-256 fingerprint from the temporary file path using the updated service
        const fingerprint = await fingerprintService.getHashFromFile(req.file.path);
        const existingFile = await File.findOne({ where: { fingerprint } });
        if (existingFile) {
            logger.warn(`[Step 1] Conflict: File with fingerprint ${fingerprint} already exists.`);
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
                await vectorSearchService.indexImage(tempPath, newFile.id.toString());
                logger.info(`[Background] Vector indexing complete for File ID: ${newFile.id}`);
            } catch (err) {
                logger.error(`[Background] Vector indexing failed for File ID: ${newFile.id}`, err);
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
        logger.error('[Step 1] An error occurred during the protection process:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: '伺服器內部錯誤', error: error.message });
    } finally {
        fs.unlink(tempPath, err => {
            if (err) logger.warn(`[Step 1] Failed to delete temp file ${tempPath}:`, err);
        });
    }
});

const handleScanRequest = async (req, res) => {
    const fileId = req.params.fileId || req.body.fileId;
    const routeName = req.path.includes('step2') ? '[Step2]' : '[Scan Route]';

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
        if (!imageBuffer) {
            return res.status(500).json({ error: '從 IPFS 讀取圖片失敗。' });
        }
        logger.info(`${routeName} Image retrieved from IPFS successfully.`);

        logger.info(`${routeName} Performing full scan...`);
        const scanResults = await scannerService.performFullScan({
            buffer: imageBuffer,
            keyword: file.keywords || file.title || file.filename
        });
        logger.info(`${routeName} Full scan complete.`);

        logger.info(`${routeName} Performing internal vector search...`);
        const vectorMatches = await vectorSearchService.searchLocalImage(imageBuffer);
        logger.info(`${routeName} Internal vector search found ${vectorMatches?.results?.length || 0} similar results.`);

        const finalResults = { ...scanResults, internalMatches: vectorMatches };
        file.status = 'scanned';
        file.resultJson = JSON.stringify(finalResults);
        await file.save();
        logger.info(`${routeName} Scan results saved to database.`);

        const reportFileName = `report_${fileId}_${Date.now()}.pdf`;
        const reportPath = path.join(REPORTS_DIR, reportFileName);
        const reportUrl = `${process.env.PUBLIC_HOST}/uploads/reports/${reportFileName}`;

        const suspiciousLinks = [
            ...(finalResults.imageSearch?.googleVision?.links || []),
            ...((finalResults.imageSearch?.tineye?.matches || []).flatMap(m => m.backlinks || [m.url]))
        ].filter(Boolean);

        setImmediate(async () => {
            try {
                await generateScanPDFWithMatches({
                    file: file,
                    suspiciousLinks,
                    matchedImages: vectorMatches?.results || [],
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

router.get('/view/:fileId', async (req, res) => {
    const { fileId } = req.params;
    const userEmail = req.user ? req.user.email : 'anonymous';
    const userIp = req.ip;

    try {
        const file = await File.findByPk(fileId);
        if (!file) return res.status(404).send('File not found');

        const originalImageBuffer = await ipfsService.getFile(file.ipfs_hash);
        if (!originalImageBuffer) return res.status(500).send('Could not retrieve image from IPFS');

        const watermarkLines = [
            `Protected by SooZoo Kaizoku Hunter`,
            `Accessor: ${userEmail} @ ${userIp}`,
            `Time: ${new Date().toISOString()}`
        ];

        const svgTextElements = watermarkLines.map((line, index) =>
            `<tspan x="50%" dy="${index === 0 ? 0 : '1.2em'}">${line}</tspan>`
        ).join('');

        const watermarkSvg = `
            <svg width="600" height="150">
                <style>
                    .title {
                        fill: rgba(255, 255, 255, 0.4);
                        font-size: 20px;
                        font-family: Arial, sans-serif;
                        font-weight: bold;
                        text-anchor: middle;
                    }
                </style>
                <text y="50%" class="title">${svgTextElements}</text>
            </svg>
        `;

        const watermarkedBuffer = await sharp(originalImageBuffer)
            .composite([{ input: Buffer.from(watermarkSvg), tile: true, gravity: 'center' }])
            .jpeg({ quality: 90 })
            .toBuffer();

        res.set('Content-Type', 'image/jpeg');
        res.send(watermarkedBuffer);

    } catch (error) {
        logger.error(`[View Route] Failed to generate watermarked image for File ID ${fileId}:`, error);
        res.status(500).send('Error generating protected image.');
    }
});

module.exports = router;
