// express/routes/protect.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Models
const { User, File, sequelize } = require('../models');

// Services & Utils
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const { infringementScan } = require('../services/vision.service');
const logger = require('../utils/logger');
const multer = require('multer');

// --- Multer configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join('/app/uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

// --- Directory Setup ---
const UPLOAD_BASE_DIR = path.resolve('/app/uploads');
const CERT_DIR = path.join(UPLOAD_BASE_DIR, 'certificates');
const REPORTS_DIR = path.join(UPLOAD_BASE_DIR, 'reports');

[UPLOAD_BASE_DIR, CERT_DIR, REPORTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`[Setup] Created directory: ${dir}`);
    }
});

// --- PDF Generation Logic ---
let base64TTF = '';
try {
    const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
    if (fs.existsSync(fontPath)) {
        base64TTF = fs.readFileSync(fontPath).toString('base64');
        logger.info('[PDF Service] NotoSansTC font loaded.');
    }
} catch (e) {
    logger.error('[PDF Service] Font loading error:', e);
}

const launchBrowser = () => {
    return puppeteer.launch({
        headless: 'new',
        executablePath: process.env.CHROMIUM_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
};

async function generateCertificatePDF(data, outputPath) {
    logger.info(`[PDF Service] Generating certificate: ${outputPath}`);
    let browser;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();
        const { user, file, title } = data;

        const htmlContent = `
            <html>
                <head>
                    <meta charset="utf-8" />
                    <style>
                        @font-face {
                            font-family: "NotoSans";
                            src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
                        }
                        body { font-family: "NotoSans", sans-serif; margin: 40px; color: #333; }
                        h1 { text-align: center; }
                        .field { margin: 8px 0; font-size: 14px; word-break: break-all; }
                        b { font-weight: bold; }
                        .footer { text-align: center; margin-top: 40px; color: #888; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <h1>原創著作證明書</h1>
                    <div class="field"><b>作者姓名：</b> ${user.real_name || 'N/A'}</div>
                    <div class="field"><b>電子郵件：</b> ${user.email}</div>
                    <div class="field"><b>手機：</b> ${user.phone || 'N/A'}</div>
                    <hr/>
                    <div class="field"><b>作品標題：</b> ${title || file.title}</div>
                    <div class="field"><b>原始檔名：</b> ${file.filename}</div>
                    <div class="field"><b>存證時間：</b> ${new Date(file.created_at).toLocaleString('zh-TW')}</div>
                    <hr/>
                    <div class="field"><b>數位指紋 (SHA-256)：</b> ${file.fingerprint}</div>
                    <div class="field"><b>IPFS Hash：</b> ${file.ipfs_hash || 'N/A'}</div>
                    <div class="field"><b>區塊鏈交易 Hash：</b> ${file.tx_hash || 'N/A'}</div>
                    <div class="footer">© 2025 SUZOO IP Guard</div>
                </body>
            </html>`;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
        logger.info(`[PDF Service] Certificate generated successfully.`);
    } catch (err) {
        logger.error('[PDF Service] Error generating PDF:', err);
        throw err;
    } finally {
        if (browser) await browser.close();
    }
}

// --- Route Handlers ---

// [ROUTE 1] File Upload and Certificate Generation
router.post('/step1', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { realName, email, phone, title, keywords } = req.body;
    if (!realName || !email || !phone || !title) {
        return res.status(400).json({ message: 'Name, email, phone, and title are required.' });
    }

    const transaction = await sequelize.transaction();
    const { path: tempFilePath } = req.file;

    try {
        const fileBuffer = fs.readFileSync(tempFilePath);
        const fingerprint = fingerprintService.sha256(fileBuffer);

        const existingFile = await File.findOne({ where: { fingerprint }, transaction });
        if (existingFile) {
            await transaction.rollback();
            // ★ 優化409響應，返回更多資訊 ★
            return res.status(409).json({
                message: 'This file has already been protected.',
                file: {
                    id: existingFile.id,
                    filename: existingFile.filename,
                    fingerprint: existingFile.fingerprint,
                    ipfsHash: existingFile.ipfs_hash,
                    txHash: existingFile.tx_hash
                }
            });
        }
        
        let user = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] }, transaction });
        if (!user) {
            const tempPassword = Math.random().toString(36).slice(-8);
            user = await User.create({
                email, phone, real_name: realName, password: await bcrypt.hash(tempPassword, 10), role: 'trial'
            }, { transaction });
            logger.info(`New user created: ${email}`);
        }


        const ipfsHash = await ipfsService.saveFile(fileBuffer).catch(e => {
            logger.error(`IPFS upload failed: ${e.message}`);
            return null;
        });

        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash).catch(e => {
            logger.error(`Blockchain transaction failed: ${e.message}`);
            return null;
        });

        const newFile = await File.create({
            user_id: user.id,
            filename: req.file.originalname,
            title,
            keywords,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txReceipt?.transactionHash || null,
            status: 'protected',
            mime_type: req.file.mimetype,
            size: req.file.size
        }, { transaction });

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
            }
        });

    } catch (error) {
        await transaction.rollback();
        logger.error(`[Protect Step1] Critical error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: `Server error during file processing: ${error.message}` });
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlink(tempFilePath, (err) => {
                if (err) logger.error(`[Cleanup] Failed to delete temp file: ${tempFilePath}`, err);
            });
        }
    }
});

// ★ 新增路由：獲取單一檔案資訊，讓前端頁面可被刷新 ★
router.get('/file/:fileId', async (req, res) => {
    try {
        const file = await File.findByPk(req.params.fileId, {
            attributes: ['id', 'filename', 'fingerprint', 'ipfs_hash', 'tx_hash', 'status']
        });
        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }
        // 將 snake_case 轉換為 camelCase
        res.json({
            id: file.id,
            filename: file.filename,
            fingerprint: file.fingerprint,
            ipfsHash: file.ipfs_hash,
            txHash: file.tx_hash,
            status: file.status
        });
    } catch (error) {
        logger.error(`Error fetching file info: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching file data.' });
    }
});


// [ROUTE] Certificate Download
router.get('/certificates/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const fileRecord = await File.findByPk(fileId);

        if (!fileRecord || !fileRecord.certificate_path) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        const pdfPath = fileRecord.certificate_path;
        if (!fs.existsSync(pdfPath)) {
            logger.error(`Certificate file missing from disk: ${pdfPath}`);
            return res.status(404).json({ message: 'Certificate file is missing.' });
        }
        res.download(pdfPath, `Certificate_${fileRecord.filename}.pdf`);
    } catch (error) {
        logger.error(`Error downloading certificate:`, error);
        res.status(500).json({ message: 'Server error while fetching certificate.' });
    }
});


// ★ 路由方法從 GET 改為 POST，更符合 RESTful 原則 ★
router.post('/scan/:fileId', async(req, res) => {
    try {
        const fileId = req.params.fileId;
        const fileRec = await File.findByPk(fileId);
        if (!fileRec) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (!fileRec.ipfs_hash) {
            return res.status(400).json({ message: 'File is not stored on IPFS, cannot perform scan.' });
        }

        // The temporary uploaded file is already deleted, so we need to get it from IPFS
        const fileBuffer = await ipfsService.getFile(fileRec.ipfs_hash);
        if (!fileBuffer) {
            return res.status(500).json({ message: 'Could not retrieve file from IPFS for scanning.' });
        }

        const report = await infringementScan({ buffer: fileBuffer });
        
        const allLinks = [];
        if (report.tineye?.success) allLinks.push(...report.tineye.links);
        if (report.vision?.success) allLinks.push(...report.vision.links);

        const uniqueLinks = [...new Set(allLinks)];

        await fileRec.update({
            status: 'scanned',
            infringingLinks: uniqueLinks
        });
        
        res.json({
            message: 'Scan completed successfully.',
            suspiciousLinks: uniqueLinks,
        });

    } catch (e) {
        logger.error('[Scan Route] Error:', e);
        res.status(500).json({ message: 'An unexpected error occurred during the scan.', detail: e.message });
    }
});

module.exports = router;
