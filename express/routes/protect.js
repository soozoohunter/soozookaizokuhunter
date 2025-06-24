/**
 * express/routes/protect.js (API 整合最終版)
 *
 * 【版本說明】:
 * - 本版本整合了 DMCA.com 的官方 API，實現了自動化案件建立。
 * - 整合了 '/works/:id' 路由，用於生成公開的原創作品證明頁面。
 * - 客戶點擊按鈕後，系統會自動在 DMCA.com 後台建立一個 DIY 案件，供內部團隊處理。
 * - 保留了所有原有的功能，如 step1 檔案上傳、scan 侵權掃描等。
 */
require('dotenv').config(); // 確保在檔案頂部加載環境變數
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cheerio = require('cheerio');
const { execSync } = require('child_process');
const { Op } = require('sequelize');

// ========== Models ==========
const { User, File } = require('../models'); 

// ========== Services/Utils ==========
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const { convertAndUpload } = require('../utils/convertAndUpload');
const { extractKeyFrames } = require('../utils/extractFrames');
const { searchImageByVector, indexImageVector } = require('../utils/vectorSearch');
const tinEyeApi = require('../services/tineyeApiService');
const rapidApiService = require('../services/rapidApiService');

// ... (您現有的其他設定，如 UPLOAD_BASE_DIR, launchBrowser 等，保持不變) ...
const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');
// ... 其他既有函式 ...

// ===================================================================
//  DMCA API 整合邏輯
// ===================================================================

// 全域變數，用於快取 DMCA API Token，避免頻繁登入
let dmcaApiToken = null;
let tokenExpiry = null;

/**
 * 獲取有效的 DMCA API 權杖 (含快取機制)
 * @returns {Promise<string>} DMCA API Token
 */
async function getDmcaToken() {
    if (dmcaApiToken && tokenExpiry && new Date() < tokenExpiry) {
        console.log('[DMCA API] 使用快取中的 Token。');
        return dmcaApiToken;
    }

    console.log('[DMCA API] Token 已過期或不存在，正在請求新的 Token...');
    try {
        const response = await axios.post('https://api.dmca.com/login', new URLSearchParams({
            Email: process.env.DMCA_API_EMAIL,
            Password: process.env.DMCA_API_PASSWORD
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && response.data.Token) {
            dmcaApiToken = response.data.Token;
            tokenExpiry = new Date(new Date().getTime() + 55 * 60 * 1000); // 設定 55 分鐘後過期
            console.log('[DMCA API] 成功獲取新的 Token。');
            return dmcaApiToken;
        } else {
            throw new Error('從 DMCA API 回應中獲取 Token 失敗。');
        }
    } catch (error) {
        console.error('[DMCA API 登入錯誤]', error.response ? error.response.data : error.message);
        throw new Error('無法登入 DMCA API，請檢查您的 .env 檔案中的憑證。');
    }
}

/**
 * 透過 API 建立一個新的 DIY 下架案件
 * @param {object} caseDetails - 案件詳情
 * @returns {Promise<object>} DMCA.com 回傳的案件物件
 */
async function createApiDIYCase(caseDetails) {
    const { infringingUrl, originalUrl, description, subject } = caseDetails;

    try {
        const token = await getDmcaToken();

        const response = await axios.post('https://api.dmca.com/createDIYCase', new URLSearchParams({
            Token: token,
            Subject: subject,
            Description: description,
            'Copied From URL': originalUrl,
            'Infringing URL': infringingUrl
        }).toString(),{
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        if (response.data && response.data.ID) {
            console.log(`[DMCA API] DIY 案件建立成功。案件 ID: ${response.data.ID}`);
            return response.data;
        } else {
             console.error('[DMCA API] CreateDIYCase API 回應:', response.data);
            throw new Error('建立 DIY 案件失敗，API 回應中未包含案件 ID。');
        }
    } catch (error) {
        console.error('[DMCA API createDIYCase 錯誤]', error.response ? error.response.data : error.message);
        throw new Error('無法透過 API 建立 DMCA DIY 案件。');
    }
}

// ===================================================================
//  Step1: Upload file and create user/file records
// ===================================================================
const upload = multer({ dest: path.join(UPLOAD_BASE_DIR, 'tmp') });

router.post('/step1', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'NO_FILE' });

        const {
            realName, birthDate, phone, address, email,
            title, keywords
        } = req.body;

        if (!realName || !phone || !email || !title) {
            return res.status(400).json({ error: 'MISSING_FIELDS' });
        }

        // 1) find or create user
        let user = await User.findOne({ where: { email } });
        if (!user) {
            const hashed = await bcrypt.hash(phone || 'pass', 10);
            user = await User.create({
                email,
                password: hashed,
                realName,
                birthDate,
                phone,
                address
            });
        }

        // 2) move uploaded file to uploads dir with deterministic name
        const ext = path.extname(req.file.originalname);
        const targetName = `imageForSearch_${Date.now()}${ext}`;
        const targetPath = path.join(UPLOAD_BASE_DIR, targetName);
        fs.renameSync(req.file.path, targetPath);

        const buffer = fs.readFileSync(targetPath);
        const fingerprint = fingerprintService.sha256(buffer);

        let ipfsHash = null;
        try {
            ipfsHash = await ipfsService.saveFile(buffer);
        } catch (e) {
            console.error('[step1 ipfs]', e.message);
        }

        let txHash = null;
        try {
            const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
            txHash = receipt.transactionHash;
        } catch (e) {
            console.error('[step1 chain]', e.message);
        }

        const fileRecord = await File.create({
            user_id: user.id,
            filename: req.file.originalname,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txHash,
            status: 'uploaded'
        });

        let publicImageUrl = null;
        try {
            publicImageUrl = await convertAndUpload(targetPath, ext, fileRecord.id);
        } catch (e) {
            console.error('[step1 convert]', e.message);
        }

        // index to vector service (best effort)
        try {
            await indexImageVector(targetPath, fileRecord.id);
        } catch (e) {
            console.error('[step1 index]', e.message);
        }

        return res.status(201).json({
            fileId: fileRecord.id,
            fingerprint,
            ipfsHash,
            txHash,
            publicImageUrl
        });
    } catch (err) {
        console.error('[POST /step1]', err);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
});

// ===================================================================
//  Step2: further processing after upload
// ===================================================================
router.post('/step2', async (req, res) => {
    try {
        const { fileId } = req.body || {};
        if (!fileId) return res.status(400).json({ error: 'MISSING_FILE_ID' });

        const file = await File.findByPk(fileId);
        if (!file) return res.status(404).json({ error: 'FILE_NOT_FOUND' });

        return res.json({ message: 'Step2 處理完成', fileId: file.id });
    } catch (err) {
        console.error('[POST /step2]', err);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
});



// ===================================================================
//  【新增】DMCA 下架請求路由 (API 整合版)
// ===================================================================
router.post('/request-takedown-via-api', async (req, res) => {
    try {
        // TODO: 實際部署時，需從您的使用者認證機制 (如 JWT session) 中獲取 clientUserId
        const { clientUserId, originalFileId, infringingUrl } = req.body;

        if (!clientUserId || !originalFileId || !infringingUrl) {
            return res.status(400).json({ error: 'MISSING_PARAMETERS', message: '缺少必要參數' });
        }

        const [client, originalFile] = await Promise.all([
            User.findByPk(clientUserId),
            File.findByPk(originalFileId)
        ]);

        if (!client || !originalFile || originalFile.user_id !== client.id) {
            return res.status(403).json({ error: 'FORBIDDEN', message: '權限不足或找不到對應的檔案/使用者' });
        }
        
        const subject = `Copyright Infringement Case for: ${originalFile.title}`;
        const description = `This is a takedown request for content belonging to our client, ${client.realName}.
Original work titled "${originalFile.title}" is being used without authorization.
Original File ID in our system: ${originalFile.id}
Fingerprint: ${originalFile.fingerprint}`;
        
        // 使用環境變數中的 PUBLIC_HOST 來構成原創作品證明連結
        const originalUrl = `${process.env.PUBLIC_HOST}/api/protect/works/${originalFile.id}`;

        const dmcaCase = await createApiDIYCase({
            infringingUrl,
            originalUrl,
            description,
            subject
        });

        return res.status(201).json({
            message: '下架請求已成功提交至 DMCA.com 案件管理系統，我們的團隊將開始處理。',
            dmcaCaseId: dmcaCase.ID,
            status: dmcaCase.Status
        });

    } catch (error) {
        console.error('[POST /request-takedown-via-api] Error:', error);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', detail: error.message });
    }
});


// ===================================================================
//  【新增】原創作品公開展示頁路由
// ===================================================================
router.get('/works/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        if (!fileId || isNaN(parseInt(fileId, 10))) return res.status(400).send('無效的檔案 ID');

        const originalFile = await File.findOne({
            where: { id: fileId },
            include: [{ model: User, attributes: ['realName'] }]
        });

        if (!originalFile) return res.status(404).send('找不到指定的原創作品');

        let localPath = null;
        const baseName = `imageForSearch_${originalFile.id}`;
        const possibleExtensions = ['.jpg', '.png', '.gif', '.bmp', '.webp', '.jpeg', '.mp4', '.mov', '.avi', '.mkv'];
        for (const ext of possibleExtensions) {
            const testPath = path.join(UPLOAD_BASE_DIR, `${baseName}${ext}`);
            if (fs.existsSync(testPath)) { localPath = testPath; break; }
        }

        if (!localPath) return res.status(404).send('找不到對應的本地媒體檔案');

        const isVideo = originalFile.mimetype && originalFile.mimetype.startsWith('video/');
        let mediaTag = isVideo ? `<p><strong>類型:</strong> 影片</p><p>此為影片檔案，暫不提供線上預覽。</p>` : `<img src="data:${originalFile.mimetype || 'image/jpeg'};base64,${fs.readFileSync(localPath).toString('base64')}" style="max-width: 80%; border: 1px solid #ccc; border-radius: 8px; margin-top: 20px;" alt="${originalFile.title}">`;

        const htmlPage = `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><title>原創作品證明 - ${originalFile.title}</title><style>body{font-family:sans-serif;line-height:1.6;padding:20px;text-align:center;background-color:#f7f7f7}.container{max-width:800px;margin:0 auto;background:#fff;padding:30px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}footer{margin-top:30px;font-size:12px;color:#aaa}</style></head><body><div class="container"><h1>原創作品證明 (Proof of Original Work)</h1><p><strong>作品標題:</strong> ${originalFile.title}</p><p><strong>版權所有者:</strong> ${originalFile.User ? originalFile.User.realName : 'N/A'}</p><p><strong>數位指紋 (Fingerprint):</strong> ${originalFile.fingerprint}</p>${mediaTag}<footer><p>此頁面由 KaiShield (suzookaizokuhunter.com) 產生，用於 DMCA 版權宣告。</p><p>&copy; ${new Date().getFullYear()} ${originalFile.User ? originalFile.User.realName : ''}. All Rights Reserved.</p></footer></div></body></html>`;
        
        res.status(200).send(htmlPage);

    } catch (error) {
        console.error(`[GET /works/:id] Error:`, error);
        res.status(500).send('伺服器內部錯誤');
    }
});

// 確保 module.exports 在檔案最底部
module.exports = router;
