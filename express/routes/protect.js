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
const { User, File, Scan, SubscriptionPlan, UserSubscription, sequelize } = require('../models');

// Services & Utils
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const queueService = require('../services/queue.service');
const logger = require('../utils/logger');
const multer = require('multer');

// --- Multer Configuration ---
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
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

// --- Directory Setup ---
const UPLOAD_BASE_DIR = path.resolve('/app/uploads');
const CERT_DIR = path.join(UPLOAD_BASE_DIR, 'certificates');
[UPLOAD_BASE_DIR, CERT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ★★★ 關鍵升級：PDF 生成邏輯，現在可以接收圖片 Buffer 來產生縮圖 ★★★
async function generateCertificatePDF(data, outputPath) {
    logger.info(`[PDF Service] Generating certificate with thumbnail: ${outputPath}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.CHROMIUM_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        const { user, file, title, imageBuffer } = data;

        // 將圖片 buffer 轉換為 Base64 Data URL
        const imageBase64 = imageBuffer ? `data:${file.mime_type};base64,${imageBuffer.toString('base64')}` : '';

        const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
        const base64TTF = fs.existsSync(fontPath) ? fs.readFileSync(fontPath).toString('base64') : '';

        const htmlContent = `
            <html><head><meta charset="utf-8" />
            <style>
                @font-face { font-family: "NotoSans"; src: url("data:font/ttf;base64,${base64TTF}") format("truetype"); }
                body { font-family: "NotoSans", sans-serif; margin: 40px; color: #333; }
                .container { display: flex; flex-direction: column; }
                .header, .footer { text-align: center; }
                .content { display: flex; gap: 20px; margin-top: 20px; }
                .details { flex: 1; }
                .thumbnail { flex-shrink: 0; width: 150px; }
                .thumbnail img { max-width: 100%; border: 1px solid #ccc; }
                .field { margin: 8px 0; font-size: 14px; word-break: break-all; }
                b { font-weight: bold; }
            </style></head>
            <body><div class="container">
                <div class="header"><h1>原創著作證明書</h1></div>
                <div class="content">
                    <div class="details">
                        <div class="field"><b>作者姓名：</b> ${user.real_name || 'N/A'}</div>
                        <div class="field"><b>電子郵件：</b> ${user.email}</div>
                        <div class="field"><b>手機：</b> ${user.phone || 'N/A'}</div>
                        <hr/>
                        <div class="field"><b>作品標題：</b> ${title || file.title}</div>
                        <div class="field"><b>原始檔名：</b> ${file.filename}</div>
                        <div class="field"><b>存證時間：</b> ${new Date(file.created_at).toLocaleString('zh-TW')}</div>
                    </div>
                    ${imageBase64 ? `<div class="thumbnail"><p><b>作品縮圖</b></p><img src="${imageBase64}" alt="thumbnail"/></div>` : ''}
                </div>
                <hr/>
                <div class="field"><b>數位指紋 (SHA-256)：</b> ${file.fingerprint}</div>
                <div class="field"><b>IPFS Hash：</b> ${file.ipfs_hash || 'N/A'}</div>
                <div class="field"><b>區塊鏈交易 Hash：</b> ${file.tx_hash || 'N/A'}</div>
                <div class="footer"><p>© 2025 SUZOO IP Guard</p></div>
            </div></body></html>`;

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


// [ROUTE 1] 免費試用流程
router.post('/trial', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: '請選擇一個檔案' });
    
    const { realName, email, phone, title, keywords } = req.body;
    if (!realName || !email || !phone || !title) {
        return res.status(400).json({ message: '姓名、Email、電話和作品標題為必填項。' });
    }

    const transaction = await sequelize.transaction();
    const { path: tempFilePath, mimetype } = req.file;

    try {
        const fileBuffer = fs.readFileSync(tempFilePath);
        const fingerprint = fingerprintService.sha256(fileBuffer);

        const existingFile = await File.findOne({ where: { fingerprint }, transaction });
        if (existingFile) {
            await transaction.rollback();
            return res.status(409).json({ message: '此檔案先前已被保護，請嘗試其他檔案。' });
        }
        
        // 尋找或建立一個 'trial' 類型的臨時使用者帳號
        let user = await User.findOne({ where: { email, role: 'trial' }, transaction });
        if (!user) {
            user = await User.create({
                email, phone, real_name: realName, role: 'trial', status: 'active'
            }, { transaction });
            logger.info(`[Trial] New trial user created: ${email}`);
        }

        const ipfsHash = await ipfsService.saveFile(fileBuffer);
        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);

        const newFile = await File.create({
            user_id: user.id,
            filename: req.file.originalname,
            title,
            keywords,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txReceipt?.transactionHash || null,
            status: 'protected',
            mime_type: mimetype,
            size: req.file.size
        }, { transaction });

        const pdfPath = path.join(CERT_DIR, `certificate_trial_${newFile.id}.pdf`);
        
        // ★★★ 傳入 imageBuffer 來產生帶有縮圖的 PDF ★★★
        await generateCertificatePDF({ user, file: newFile, title, imageBuffer: fileBuffer }, pdfPath);
        await newFile.update({ certificate_path: pdfPath }, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: "檔案保護成功，已為您產生原創證明書。",
            file: {
                id: newFile.id,
                filename: newFile.filename,
                fingerprint: newFile.fingerprint,
                ipfsHash: newFile.ipfs_hash,
                txHash: newFile.tx_hash,
                isTrial: true // 標記這是試用流程的產物
            },
            user: {
                realName: user.real_name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        await transaction.rollback();
        logger.error(`[Trial Process] Critical error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: `伺服器處理錯誤: ${error.message}` });
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlink(tempFilePath, (err) => {
                if (err) logger.error(`[Cleanup] Failed to delete temp file: ${tempFilePath}`, err);
            });
        }
    }
});

// [ROUTE 2] 派發掃描任務 (通用)
router.post('/:fileId/dispatch-scan', async (req, res) => {
    // 這裡可以加入 auth 中介層，來判斷是試用者還是付費會員，並檢查額度
    const { fileId } = req.params;
    if (!fileId) return res.status(400).json({ message: '缺少檔案 ID' });

    try {
        const file = await File.findByPk(fileId);
        if (!file) return res.status(404).json({ message: '找不到檔案' });

        const scan = await Scan.create({
            file_id: file.id,
            user_id: file.user_id,
            status: 'pending',
            progress: 5
        });

        await queueService.sendToQueue({
            scanId: scan.id,
            fileId: file.id,
            userId: file.user_id,
            ipfsHash: file.ipfs_hash,
            fingerprint: file.fingerprint,
            keywords: file.keywords,
        });

        logger.info(`[Dispatch] Scan task ${scan.id} for file ${file.id} has been dispatched.`);

        res.status(202).json({
            message: '掃描任務已成功派發',
            scanId: scan.id,
            file: { id: file.id, filename: file.filename, }
        });

    } catch (error) {
        logger.error(`[Dispatch] Failed to dispatch scan for file ${fileId}:`, error);
        res.status(500).json({ message: '無法派發掃描任務' });
    }
});


// [ROUTE 3] 下載證書 (通用)
router.get('/certificates/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const fileRecord = await File.findByPk(fileId);
        if (!fileRecord || !fileRecord.certificate_path || !fs.existsSync(fileRecord.certificate_path)) {
            return res.status(404).json({ message: '找不到證書檔案。' });
        }
        res.download(fileRecord.certificate_path, `Certificate_${fileRecord.filename}.pdf`);
    } catch (error) {
        logger.error(`Error downloading certificate:`, error);
        res.status(500).json({ message: '下載證書時發生錯誤。' });
    }
});

module.exports = router;
