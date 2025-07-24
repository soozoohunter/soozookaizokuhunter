// express/routes/protect.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // ★ 引入 bcryptjs
const { Op } = require('sequelize');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { User, File, Scan, sequelize } = require('../models');
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const queueService = require('../services/queue.service');
const logger = require('../utils/logger');
const multer = require('multer');

// ★★★ 核心優化：使用 memoryStorage 將檔案暫存於記憶體中 ★★★
// 這讓我們能直接取得檔案 buffer，完美解決中文檔名亂碼，且無需再處理磁碟上的暫存檔。
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

const UPLOAD_BASE_DIR = path.resolve('/app/uploads');
const CERT_DIR = path.join(UPLOAD_BASE_DIR, 'certificates');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

// PDF 生成邏輯 (包含縮圖功能)
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
        const imageBase64 = imageBuffer ? `data:${file.mime_type};base64,${imageBuffer.toString('base64')}` : '';
        const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
        const base64TTF = fs.existsSync(fontPath) ? fs.readFileSync(fontPath).toString('base64') : '';

        const htmlContent = `
            <html><head><meta charset="utf-8" /><style>@font-face { font-family: "NotoSans"; src: url("data:font/ttf;base64,${base64TTF}") format("truetype"); } body { font-family: "NotoSans", sans-serif; margin: 40px; color: #333; } .container { display: flex; flex-direction: column; } .header, .footer { text-align: center; } .content { display: flex; gap: 20px; margin-top: 20px; border: 1px solid #eee; padding: 20px; border-radius: 8px; } .details { flex: 1; } .thumbnail { flex-shrink: 0; width: 150px; text-align: center; } .thumbnail img { max-width: 100%; border: 1px solid #ccc; border-radius: 4px; } .field { margin: 10px 0; font-size: 14px; word-break: break-all; } b { font-weight: bold; color: #1a2a6c; }</style></head>
            <body><div class="container">
                <div class="header"><h1>原創著作證明書</h1></div>
                <div class="content">
                    <div class="details">
                        <div class="field"><b>作者姓名：</b> ${user.real_name || 'N/A'}</div>
                        <div class="field"><b>電子郵件：</b> ${user.email}</div>
                        <div class="field"><b>手機：</b> ${user.phone || 'N/A'}</div><hr/>
                        <div class="field"><b>作品標題：</b> ${title || file.title}</div>
                        <div class="field"><b>原始檔名：</b> ${file.filename}</div>
                        <div class="field"><b>存證時間：</b> ${new Date(file.created_at).toLocaleString('zh-TW')}</div>
                    </div>
                    ${imageBase64 ? `<div class="thumbnail"><p><b>作品縮圖</b></p><img src="${imageBase64}" alt="thumbnail"/></div>` : ''}
                </div><hr/>
                <div class="field"><b>數位指紋 (SHA-256)：</b> ${file.fingerprint}</div>
                <div class="field"><b>IPFS Hash：</b> ${file.ipfs_hash || 'N/A'}</div>
                <div class="field"><b>區塊鏈交易 Hash：</b> ${file.tx_hash || 'N/A'}</div>
                <div class="footer"><p style="margin-top: 40px; font-size: 12px; color: #888;">© ${new Date().getFullYear()} SUZOO IP Guard</p></div>
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

// 免費試用流程
router.post('/trial', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: '請選擇一個檔案' });
    
    const fileBuffer = req.file.buffer;
    const mimetype = req.file.mimetype;
    const originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    
    const { realName, email, phone, title, keywords } = req.body;
    if (!realName || !email || !phone || !title) {
        return res.status(400).json({ message: '姓名、Email、電話和作品標題為必填項。' });
    }

    const transaction = await sequelize.transaction();

    try {
        const fingerprint = fingerprintService.sha256(fileBuffer);

        const existingFile = await File.findOne({ where: { fingerprint } });
        if (existingFile) {
            await transaction.rollback();
            return res.status(409).json({ message: '此檔案先前已被保護，請嘗試其他檔案。' });
        }
        
        // ★★★ 關鍵修正：為新建立的 trial 用戶生成一個隨機的佔位密碼 ★★★
        const tempPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        let user = await User.findOrCreate({
            where: { email, role: 'trial' },
            defaults: {
                phone,
                real_name: realName,
                role: 'trial',
                status: 'active',
                password: hashedPassword // 將加密後的佔位密碼存入
            },
            transaction
        });
        user = user[0];

        const ipfsHash = await ipfsService.saveFile(fileBuffer);
        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);

        const newFile = await File.create({
            user_id: user.id,
            filename: originalname,
            title,
            keywords,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txReceipt?.transactionHash || null,
            status: 'protected',
            mime_type: mimetype,
            size: fileBuffer.length
        }, { transaction });

        const pdfPath = path.join(CERT_DIR, `certificate_trial_${newFile.id}.pdf`);
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
    }
});

// 派發掃描任務 (通用)
router.post('/:fileId/dispatch-scan', async (req, res) => {
    const { fileId } = req.params;
    if (!fileId) return res.status(400).json({ message: '缺少檔案 ID' });

    try {
        const file = await File.findByPk(fileId);
        if (!file) return res.status(404).json({ message: '找不到檔案' });

        const scan = await Scan.create({
            file_id: file.id, user_id: file.user_id, status: 'pending', progress: 5
        });

        await queueService.sendToQueue({
            scanId: scan.id, fileId: file.id, userId: file.user_id,
            ipfsHash: file.ipfs_hash, fingerprint: file.fingerprint, keywords: file.keywords,
        });

        logger.info(`[Dispatch] Scan task ${scan.id} for file ${file.id} has been dispatched.`);
        res.status(202).json({
            message: '掃描任務已成功派發', scanId: scan.id,
            file: { id: file.id, filename: file.filename }
        });

    } catch (error) {
        logger.error(`[Dispatch] Failed to dispatch scan for file ${fileId}:`, error);
        res.status(500).json({ message: '無法派發掃描任務' });
    }
});

// 下載證書 (通用)
router.get('/certificates/:fileId', async (req, res) => {
    try {
        const fileRecord = await File.findByPk(req.params.fileId);
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
