// express/routes/protect.js (Final Corrected & Merged Version)
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// --- 資料庫模型 ---
const { User, File } = require('../models');

// --- 服務與工具 ---
const chain = require('../utils/chain');
const ipfsService = require('../services/ipfsService');
const scannerService = require('../services/scanner.service');
const fingerprintService = require('../services/fingerprintService');
const { indexImageVector, searchImageByVector } = require('../utils/vectorSearch');
const { generateScanPDFWithMatches, generateCertificatePDF } = require('../services/pdfService');

const router = express.Router();

// --- 目錄設定 ---
// 確保路徑解析是相對於專案根目錄，而不是目前檔案
const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');
const REPORTS_DIR = path.join(UPLOAD_BASE_DIR, 'reports');
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');

// --- 啟動時檢查並建立目錄 ---
[REPORTS_DIR, TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`[Setup] Directory created: ${dir}`);
    }
});

// --- Multer 檔案上傳設定 ---
const upload = multer({
    dest: TEMP_DIR,
    limits: { fileSize: 100 * 1024 * 1024 } // 限制 100 MB
});

/**
 * 路由: 步驟一 - 保護檔案 (POST /step1)
 * 接收使用者資訊與檔案，進行存證、上鏈、索引等操作。
 * 這是一個核心的、多步驟的流程。
 */
router.post('/step1', upload.single('file'), async (req, res) => {
    if (!req.file) {
        logger.warn('[Step 1] No file was uploaded.');
        return res.status(400).json({ error: '未提供檔案。' });
    }

    const { realName, birthDate, phone, address, email, title, keywords } = req.body;
    const { path: tempPath, originalname, mimetype } = req.file;
    // 如果是經過驗證的使用者，使用其 ID；否則，此操作可能需要被限制或使用預設用戶
    const userIdFromToken = req.user ? req.user.id : null;

    try {
        // 步驟 1: 查找或建立使用者
        // 使用 email 或 phone 作為唯一識別碼
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
                 // 對於匿名用戶，如果沒有提供足夠資訊，則無法建立新用戶
                return res.status(400).json({ error: '對於新用戶，姓名和電子郵件為必填項。'});
            }
            user = await User.create({ name: realName, dob: birthDate, phone, address, email });
            logger.info(`[Step 1] New user created: ${user.email} (ID: ${user.id})`);
        }

        // 步驟 2: 計算檔案指紋並檢查是否已存在
        const fingerprint = await fingerprintService.getHash(tempPath);
        const existingFile = await File.findOne({ where: { fingerprint } });
        if (existingFile) {
            logger.warn(`[Step 1] Conflict: File with fingerprint ${fingerprint} already exists.`);
            return res.status(409).json({
                message: '此圖片先前已被保護。',
                error: 'Conflict',
                file: existingFile
            });
        }

        // 步驟 3: 上傳檔案至 IPFS
        const fileBuffer = fs.readFileSync(tempPath);
        const ipfsHash = await ipfsService.saveFile(fileBuffer);
        if (!ipfsHash) {
            throw new Error('Failed to save file to IPFS.');
        }
        logger.info(`[Step 1] File saved to IPFS, CID: ${ipfsHash}`);

        // 步驟 4: 將紀錄儲存至區塊鏈
        const txReceipt = await chain.storeRecord(fingerprint, ipfsHash);
        const txHash = txReceipt.transactionHash;
        logger.info(`[Step 1] Record stored on blockchain, TxHash: ${txHash}`);

        // 步驟 5: 將檔案元數據儲存至 PostgreSQL 資料庫
        const newFile = await File.create({
            user_id: user.id,
            filename: originalname,
            title,
            keywords,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txHash,
            status: 'protected', // 初始狀態
            mime_type: mimetype,
        });
        logger.info(`[Step 1] File record saved to database, File ID: ${newFile.id}`);

        // 步驟 6: 執行非同步的背景任務 (不阻塞 API 回應)
        // 這些任務即使失敗，也不應影響主流程的成功回應
        process.nextTick(() => {
            indexImageVector(tempPath, newFile.id.toString())
                .then(() => logger.info(`[Background] Vector indexing complete for File ID: ${newFile.id}`))
                .catch(err => logger.error(`[Background] Vector indexing failed for File ID: ${newFile.id}`, err));

            generateCertificatePDF({ fileId: newFile.id })
                .then(pdfPath => logger.info(`[Background] Certificate PDF generated for File ID: ${newFile.id} at ${pdfPath}`))
                .catch(err => logger.error(`[Background] Certificate PDF generation failed for File ID: ${newFile.id}`, err));
        });

        // 步驟 7: 回傳成功回應
        res.status(201).json({ message: '檔案保護成功！', file: newFile });

    } catch (error) {
        logger.error('[Step 1] An error occurred during the protection process:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: '伺服器內部錯誤', error: error.message });
    } finally {
        // 步驟 8: 清理臨時檔案
        fs.unlink(tempPath, (err) => {
            if (err) logger.warn(`[Step 1] Failed to delete temp file ${tempPath}:`, err);
        });
    }
});

/**
 * 路由: 掃描指定檔案 (GET /scan/:fileId)
 * 觸發全方位的侵權掃描服務，並產生報告。
 */
router.get('/scan/:fileId', async (req, res) => {
    const { fileId } = req.params;
    logger.info(`[Scan Route] Received scan request for File ID: ${fileId}`);

    try {
        const file = await File.findByPk(fileId);
        if (!file) {
            return res.status(404).json({ error: '找不到指定的檔案紀錄。' });
        }

        // 從 IPFS 獲取圖片 Buffer
        const imageBuffer = await ipfsService.getFile(file.ipfs_hash);
        if (!imageBuffer) {
            return res.status(500).json({ error: '從 IPFS 讀取圖片失敗。' });
        }

        // 步驟 1: 調用整合的掃描服務
        logger.info(`[Scan Route] Performing full scan for File ID: ${fileId}`);
        const scanResults = await scannerService.performFullScan({
            buffer: imageBuffer,
            keyword: file.keywords || file.title || file.filename // 使用多個欄位作為關鍵字備援
        });

        // 步驟 2: 進行內部向量比對
        logger.info(`[Scan Route] Performing internal vector search for File ID: ${fileId}`);
        const vectorMatches = await searchImageByVector(imageBuffer);
        logger.info(`[Scan Route] Internal vector search found ${vectorMatches.length} similar results.`);

        // 步驟 3: 更新檔案狀態與掃描結果
        const finalResults = { ...scanResults, internalMatches: vectorMatches };
        file.status = 'scanned';
        file.resultJson = finalResults; // 將所有結果存入 JSON 欄位
        await file.save();

        // 步驟 4: (非同步) 產生並儲存詳細的 PDF 報告
        const reportFileName = `report_${fileId}_${Date.now()}.pdf`;
        const reportPath = path.join(REPORTS_DIR, reportFileName);
        const reportUrl = `${process.env.PUBLIC_HOST}/uploads/reports/${reportFileName}`;

        process.nextTick(() => {
            generateScanPDFWithMatches(file.id, reportPath, finalResults)
               .then(() => file.update({ report_url: reportUrl }))
               .then(() => logger.info(`[Scan Route] Report generated and URL updated for File ID: ${fileId}`))
               .catch(err => logger.error(`[Scan Route] Failed to generate or save report for File ID: ${fileId}`, err));
        });

        // 步驟 5: 立即回傳掃描結果
        res.status(200).json({
            message: '掃描完成',
            reportUrl: reportUrl, // 先提供 URL，報告會在背景生成
            results: finalResults
        });

    } catch (error) {
        logger.error(`[Scan Route] Error scanning file ID ${fileId}:`, error);
        res.status(500).json({ message: '掃描時發生內部伺服器錯誤', error: error.message });
    }
});

/**
 * 路由: 動態浮水印預覽 (GET /view/:fileId)
 * 根據訪問者資訊動態產生帶有浮水印的圖片。
 */
router.get('/view/:fileId', async (req, res) => {
    const { fileId } = req.params;
    const userEmail = req.user ? req.user.email : 'anonymous';
    const userIp = req.ip;

    try {
        const file = await File.findByPk(fileId);
        if (!file) {
            return res.status(404).send('File not found');
        }

        const originalImageBuffer = await ipfsService.getFile(file.ipfs_hash);
        if (!originalImageBuffer) {
            return res.status(500).send('Could not retrieve image from IPFS');
        }
        
        // 準備多行文字的 SVG
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
            .composite([
                {
                    input: Buffer.from(watermarkSvg),
                    tile: true,
                    gravity: 'center'
                }
            ])
            .jpeg({ quality: 90 }) // 輸出為 JPEG 格式
            .toBuffer();

        res.set('Content-Type', 'image/jpeg');
        res.send(watermarkedBuffer);

    } catch (error) {
        logger.error(`[View Route] Failed to generate watermarked image for File ID ${fileId}:`, error);
        res.status(500).send('Error generating protected image.');
    }
});

module.exports = router;
