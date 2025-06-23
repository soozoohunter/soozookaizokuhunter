/**
 * express/routes/protect.js (影片掃描功能增強版)
 *
 * 【本次重大優化】:
 * - [核心功能] 新增對影片檔案的「多重關鍵畫格掃描」機制。當上傳的檔案是影片時，系統會自動抽取多個畫格（預設3個），並對每個畫格分別執行 Google Vision, TinEye 及內部向量比對，大幅提升影片侵權來源的偵測成功率。
 * - [BUG修復] 修正了原先將影片檔案(.mp4)直接傳送給僅支援圖片的向量搜尋服務所導致的崩潰錯誤 (`searchImageByVector` error)。
 * - [BUG修復] 修正了 `step1` 中 `ffmpeg` 指令的錯誤，確保能從影片中正確截取預覽圖並生成證書PDF。
 * - [健壯性提升] 在 `/scan/:fileId` 路由中，完整地將圖片與影片的掃描流程分開處理，並在掃描結束後自動清理產生的暫存畫格檔案。
 * - 延續並保留了先前版本的所有修正與優點。
 */
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

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

// ========== Google Vision API ==========
const { infringementScan } = require('../services/visionService');

// ========== Models ==========
const { User, File } = require('../models');

// ========== Services/Utils ==========
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const { convertAndUpload } = require('../utils/convertAndUpload');
// ★ 新增：引入影片畫格抽取工具
const { extractKeyFrames } = require('../utils/extractFrames');
const { searchImageByVector, indexImageVector } = require('../utils/vectorSearch');
const { generateScanPDFWithMatches } = require('../services/pdfService');
const tinEyeApi = require('../services/tineyeApiService');

const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS || '50', 10);

const { flickerEncodeAdvanced } = require('../services/flickerService');
const rapidApiService = require('../services/rapidApiService');


// ===================================================================
// 【偵錯日誌】: 記錄所有進入此路由的請求
// ===================================================================
router.use((req, res, next) => {
    console.log(`[Protect Router] Received request: ${req.method} ${req.originalUrl}`);
    next(); // 繼續處理請求
});
// ===================================================================


const MANUAL_LINKS_PATH = path.join(__dirname, '../', 'data', 'manual_links.json');
function getAllManualLinks() {
    try {
        const raw = fs.readFileSync(MANUAL_LINKS_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('[getAllManualLinks] Failed to read manual_links.json:', err);
        return {};
    }
}

const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');
const CERT_DIR = path.join(UPLOAD_BASE_DIR, 'certificates');
const REPORTS_DIR = path.join(UPLOAD_BASE_DIR, 'reports');

function ensureUploadDirs() {
    try {
        [UPLOAD_BASE_DIR, CERT_DIR, REPORTS_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[DEBUG] Created directory => ${dir}`);
            }
        });
    } catch (e) {
        console.error('[ensureUploadDirs error]', e);
    }
}
ensureUploadDirs();

const PUBLIC_HOST = process.env.PUBLIC_HOST || 'https://suzookaizokuhunter.com';

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 }
});

const ALLOW_UNLIMITED = [
    '0900296168',
    'jeffqqm@gmail.com'
];

let base64TTF = '';
try {
    const fontBuf = fs.readFileSync(path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf'));
    base64TTF = fontBuf.toString('base64');
    console.log('[Font] Loaded NotoSansTC-VariableFont_wght.ttf as base64');
} catch (eFont) {
    console.error('[Font] Loading error =>', eFont);
}

const DEBUGSHOTS_DIR = '/app/debugShots';

function ensureDebugShotsDir() {
    try {
        if (!fs.existsSync(DEBUGSHOTS_DIR)) {
            fs.mkdirSync(DEBUGSHOTS_DIR, { recursive: true });
            console.log(`[DEBUG] Created debugShots directory => ${DEBUGSHOTS_DIR}`);
        }
    } catch (err) {
        console.error('[ensureDebugShotsDir error]', err);
    }
}
ensureDebugShotsDir();

async function launchBrowser() {
    const envHeadless = process.env.PPTR_HEADLESS ?? process.env.PUPPETEER_HEADLESS;
    const HEADLESS = envHeadless === 'false' ? false : 'new';
    console.log('[launchBrowser] starting stealth browser... headless=', HEADLESS);

    return puppeteer.launch({
        headless: HEADLESS,
        executablePath: process.env.CHROMIUM_PATH || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
            '--disable-blink-features=AutomationControlled'
        ],
        defaultViewport: { width: 1280, height: 800 }
    });
}

async function saveDebugInfo(page, tag) {
    try {
        const now = Date.now();
        const shotPath = path.join(DEBUGSHOTS_DIR, `debug_${tag}_${now}.png`);
        await page.screenshot({ path: shotPath, fullPage: true }).catch(err => {
            console.warn('[saveDebugInfo] screenshot fail =>', err);
        });

        const html = await page.content().catch(() => '<html>cannot get content</html>');
        const htmlPath = path.join(DEBUGSHOTS_DIR, `debug_${tag}_${now}.html`);
        fs.writeFileSync(htmlPath, html, 'utf8');

        const currentUrl = page.url();
        const currentTitle = await page.title().catch(() => null);
        console.log(`[saveDebugInfo] => screenshot=${shotPath}, url=${currentUrl}, title=${currentTitle}`);
    } catch (e) {
        console.warn('[saveDebugInfo] error =>', e);
    }
}

function isValidLink(str) {
    if (!str) return false;
    const trimmed = str.trim();
    const INVALID_PREFIX_RE = /^(javascript:|data:)/i;
    if (INVALID_PREFIX_RE.test(trimmed)) return false;
    try {
        const u = new URL(trimmed);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

async function generateCertificatePDF(data, outputPath) {
    console.log('[generateCertificatePDF] =>', outputPath);
    let browser;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();

        page.on('console', msg => {
            console.log(`[Browser][CertPDF] ${msg.type()}: ${msg.text()}`);
        });

        const {
            name, dob, phone, address, email,
            title, fileName, fingerprint, ipfsHash, txHash,
            serial, mimeType, issueDate, filePath,
            stampImagePath
        } = data;

        const embeddedFont = base64TTF ? `
            @font-face {
                font-family: "NotoSansTCVar";
                src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
            }
        ` : '';

        let previewTag = '';
        if (filePath && fs.existsSync(filePath) && mimeType && (mimeType.startsWith('image') || filePath.endsWith('.png'))) {
            const ext = path.extname(filePath).replace('.', '');
            const b64 = fs.readFileSync(filePath).toString('base64');
            previewTag = `<img src="data:image/${ext};base64,${b64}" style="max-width:300px; margin:10px auto; display:block;" />`;
        } else if (mimeType && mimeType.startsWith('video')) {
            previewTag = `<p style="color:gray;">(此為影片檔案，證書中僅顯示檔案資訊)</p>`;
        }

        const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
            ? `<img src="file://${stampImagePath}" style="position:absolute; top:40px; left:40px; width:100px; opacity:0.3; transform:rotate(45deg);" alt="stamp" />`
            : '';

        const html = `
        <html>
        <head>
            <meta charset="utf-8" />
            <style>
            ${embeddedFont}
            body {
                font-family: "NotoSansTCVar", sans-serif;
                margin: 40px;
                position: relative;
            }
            h1 { text-align:center; }
            .field { margin:4px 0; word-wrap: break-word; }
            .footer {
                text-align:center; margin-top:20px; color:#666; font-size:12px;
                position: relative; z-index: 99;
            }
            </style>
        </head>
        <body>
            ${stampTag}
            <h1>原創著作證明書</h1>
            <div class="field"><b>作者姓名：</b> ${name || ''}</div>
            <div class="field"><b>生日：</b> ${dob || ''}</div>
            <div class="field"><b>手機：</b> ${phone || ''}</div>
            <div class="field"><b>地址：</b> ${address || ''}</div>
            <div class="field"><b>Email：</b> ${email || ''}</div>
            <div class="field"><b>作品標題：</b> ${title || ''}</div>
            <div class="field"><b>檔名：</b> ${fileName || ''}</div>
            <div class="field"><b>Fingerprint：</b> ${fingerprint || ''}</div>
            <div class="field"><b>IPFS Hash：</b> ${ipfsHash || ''}</div>
            <div class="field"><b>TxHash：</b> ${txHash || ''}</div>
            <div class="field"><b>序號：</b> ${serial || ''}</div>
            <div class="field"><b>檔案格式：</b> ${mimeType || ''}</div>
            <div class="field"><b>發證時間：</b> ${issueDate || ''}</div>
            <div style="margin-top:10px;">${previewTag}</div>
            <div class="footer">© 2025 凱盾全球國際股份有限公司</div>
        </body>
        </html>
        `;
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('screen');

        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true
        });
        console.log('[generateCertificatePDF] done =>', outputPath);

    } catch (err) {
        console.error('[generateCertificatePDF error]', err);
        throw err;
    } finally {
        if (browser) await browser.close().catch(() => { });
    }
}

// ... (其他輔助函式 generateScanPDF, fetchLinkMainImage, aggregatorSearchLink 等保持不變) ...
async function generateScanPDF({ file, suspiciousLinks, stampImagePath }, outputPath){
    console.log('[generateScanPDF] =>', outputPath);
    let browser;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();

        page.on('console', msg => {
            console.log(`[Browser][ScanPDF] ${msg.type()}: ${msg.text()}`);
        });

        const embeddedFont = base64TTF ? `
            @font-face {
                font-family: "NotoSansTCVar";
                src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
            }
        ` : '';

        const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
            ? `<img src="file://${stampImagePath}" style="position:absolute; top:40px; right:40px; width:80px; opacity:0.3; transform:rotate(45deg);" alt="stamp" />`
            : '';

        let linksHtml = '';
        if(suspiciousLinks && suspiciousLinks.length>0){
            suspiciousLinks.forEach((l,i)=>{
                linksHtml += `<div>${i+1}. ${l}</div>`;
            });
        } else {
            linksHtml = '<p>尚未發現侵權疑似連結</p>';
        }

        const html = `
        <html>
        <head>
            <meta charset="utf-8" />
            <style>
                ${embeddedFont}
                body {
                    margin:40px;
                    font-family:"NotoSansTCVar", sans-serif;
                    position: relative;
                }
                h1 { text-align:center; }
                .footer {
                    margin-top:20px; text-align:center; color:#666; font-size:12px;
                    position: relative; z-index: 99;
                }
            </style>
        </head>
        <body>
            ${stampTag}
            <h1>侵權偵測報告</h1>
            <p>File ID: ${file.id}</p>
            <p>Filename: ${file.filename}</p>
            <p>Fingerprint: ${file.fingerprint}</p>
            <p>Status: ${file.status}</p>
            <hr/>
            <h3>可疑連結：</h3>
            ${linksHtml}
            <div class="footer">© 2025 凱盾全球國際股份有限公司</div>
        </body>
        </html>
        `;
        await page.setContent(html, { waitUntil:'networkidle0' });
        await page.emulateMediaType('screen');

        await page.pdf({
            path: outputPath,
            format:'A4',
            printBackground:true
        });
        console.log('[generateScanPDF] done =>', outputPath);

    } catch(err){
        console.error('[generateScanPDF error]', err);
        throw err;
    } finally {
        if(browser) await browser.close().catch(()=>{});
    }
}

async function fetchLinkMainImage(pageUrl){
    try {
        new URL(pageUrl);
    } catch(e) {
        throw new Error('INVALID_URL: ' + pageUrl);
    }

    try {
        const resp = await axios.get(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(resp.data);
        const ogImg = $('meta[property="og:image"]').attr('content')
                          || $('meta[name="og:image"]').attr('content');
        if(ogImg) {
            console.log('[fetchLinkMainImage] found og:image =>', ogImg);
            return ogImg;
        }
        throw new Error('No og:image => fallback puppeteer...');
    } catch(eAxios) {
        console.warn('[fetchLinkMainImage] axios fail =>', eAxios);
    }

    let browser;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();
        await page.goto(pageUrl, { waitUntil:'domcontentloaded', timeout:30000 });

        let ogImagePup = await page.evaluate(()=>{
            const m1 = document.querySelector('meta[property="og:image"]');
            if(m1 && m1.content) return m1.content;
            const m2 = document.querySelector('meta[name="og:image"]');
            if(m2 && m2.content) return m2.content;
            return '';
        });
        if(ogImagePup) {
            await browser.close();
            console.log('[fetchLinkMainImage] puppeteer og:image =>', ogImagePup);
            return ogImagePup;
        }

        const allImgs = await page.$$eval('img', imgs => imgs.map(i => ({
            src: i.src,
            w: i.naturalWidth,
            h: i.naturalHeight
        })));
        let maxW = 0;
        let chosen = '';
        for (let im of allImgs) {
            if (im.w > maxW && im.src.startsWith('http')) {
                maxW = im.w;
                chosen = im.src;
            }
        }

        await browser.close();
        if(!chosen) throw new Error('No main image found => ' + pageUrl);
        console.log('[fetchLinkMainImage] => chosen =>', chosen);
        return chosen;

    } catch(ePup) {
        console.error('[fetchLinkMainImage] puppeteer error =>', ePup);
        if(browser) await browser.close().catch(()=>{});
        throw ePup;
    }
}

async function aggregatorSearchLink(pageUrl, localFilePath, needVector=true){
    let aggregatorResult = null;
    let vectorResult = null;
    let mainImgUrl = '';

    try {
        mainImgUrl = await fetchLinkMainImage(pageUrl);
    } catch(errMain){
        console.error('[aggregatorSearchLink] fetch main image fail =>', errMain);
        return {
            aggregatorResult: null,
            vectorResult: null,
            mainImgUrl: '',
            error: errMain
        };
    }

    try {
        const resp = await axios.get(mainImgUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(localFilePath, resp.data);
        console.log('[aggregatorSearchLink] localFile =>', localFilePath);
    } catch(eDown) {
        console.error('[aggregatorSearchLink] download image fail =>', eDown);
        return {
            aggregatorResult: null,
            vectorResult: null,
            mainImgUrl,
            error: eDown
        };
    }

    const fileBufferForScan = fs.readFileSync(localFilePath);
    const keywordForScan = path.basename(pageUrl);
    const report = await infringementScan({ buffer: fileBufferForScan, keyword: keywordForScan });
    aggregatorResult = {
        tineye: report.tineye,
        vision: report.vision,
        rapid:  report.rapid
    };

    if(needVector){
        try {
            vectorResult = await searchImageByVector(localFilePath, { topK: 3 });
        } catch(eVec){
            console.error('[aggregatorSearchLink] vector fail =>', eVec);
        }
    }

    return { aggregatorResult, vectorResult, mainImgUrl };
}


router.post('/step1', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'NO_FILE', message: '請上傳檔案' });
        }
        const { realName, birthDate, phone, address, email, title, agreePolicy } = req.body;
        if (!realName || !birthDate || !phone || !address || !email || !title) {
            return res.status(400).json({ error: 'MISSING_FIELDS', message: '必填資訊不足' });
        }
        if (agreePolicy !== 'true') {
            return res.status(400).json({ error: 'POLICY_REQUIRED', message: '請勾選服務條款' });
        }

        const mimeType = req.file.mimetype;
        const isVideo = mimeType.startsWith('video');
        const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);

        if (isVideo && !isUnlimited) {
            fs.unlinkSync(req.file.path);
            return res.status(402).json({ error: 'UPGRADE_REQUIRED', message: '短影片需升級付費帳戶' });
        }

        let user = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
        let defaultPassword = null;
        if (!user) {
            const rawPass = phone + '@KaiShield';
            const hashed = await bcrypt.hash(rawPass, 10);
            user = await User.create({
                username: phone,
                email, phone,
                password: hashed,
                realName, birthDate, address,
                serialNumber: 'SN-' + Date.now(),
                role: 'user',
                plan: 'free'
            });
            defaultPassword = rawPass;
        }

        let ext = path.extname(req.file.originalname) || '';
        let realExt = '';
        if (mimeType.includes('png')) realExt = '.png';
        else if (mimeType.includes('jpeg')) realExt = '.jpg';
        else if (mimeType.includes('jpg')) realExt = '.jpg';
        else if (mimeType.includes('gif')) realExt = '.gif';
        else if (mimeType.includes('bmp')) realExt = '.bmp';
        else if (mimeType.includes('webp')) realExt = '.webp';
        else if (mimeType.includes('mp4')) realExt = '.mp4';
        else if (mimeType.includes('mov')) realExt = '.mov';
        else if (mimeType.includes('avi')) realExt = '.avi';
        else if (mimeType.includes('mkv')) realExt = '.mkv';
        if (realExt && realExt.toLowerCase() !== ext.toLowerCase()) {
            console.log(`[step1] extension mismatch => origin=${ext} => corrected=${realExt}`);
            ext = realExt;
        }

        const buf = fs.readFileSync(req.file.path);
        const fingerprint = fingerprintService.sha256(buf);

        const exist = await File.findOne({ where: { fingerprint } });
        if (exist) {
            console.log(`[step1] duplicated => File ID=${exist.id}`);
            fs.unlinkSync(req.file.path);
            return res.status(409).json({ error: 'FINGERPRINT_DUPLICATE', message: '此檔案已存在', fileId: exist.id });
        }

        let ipfsHash = '';
        try {
            ipfsHash = await ipfsService.saveFile(buf);
        } catch (eIPFS) {
            console.error('[step1 IPFS error]', eIPFS);
        }

        let txHash = '';
        if (fingerprint && ipfsHash) {
            try {
                const rec = await chain.storeRecord(fingerprint, ipfsHash);
                txHash = rec?.transactionHash || '';
            } catch (eChain) {
                console.error('[step1 chain error]', eChain);
            }
        }

        const newFile = await File.create({
            user_id: user.id,
            filename: req.file.originalname,
            title: title,
            mimetype: mimeType,
            fingerprint,
            ipfs_hash: ipfsHash,
            tx_hash: txHash,
            status: 'pending'
        });

        if (isVideo) user.uploadVideos = (user.uploadVideos || 0) + 1;
        else user.uploadImages = (user.uploadImages || 0) + 1;
        await user.save();

        const finalPath = path.join(UPLOAD_BASE_DIR, `imageForSearch_${newFile.id}${ext}`);
        try {
            fs.renameSync(req.file.path, finalPath);
        } catch (eRen) {
            if (eRen.code === 'EXDEV') {
                fs.copyFileSync(req.file.path, finalPath);
                fs.unlinkSync(req.file.path);
            } else {
                throw eRen;
            }
        }

        let previewPath = null;
        let publicImageUrl = null;

        if (isVideo) {
            try {
                // ★ 修正：使用更可靠的 ffmpeg 指令從影片中抽取單一畫格作為預覽圖
                const outP = path.join(UPLOAD_BASE_DIR, `preview_${newFile.id}.png`);
                console.log('[DEBUG] trying to extract a preview frame =>', outP);
                // 使用 -ss 擷取第 1 秒的畫面，-vframes 1 表示只取一偵，-update 1 確保正確寫入單一檔案
                const ffmpegCommand = `ffmpeg -y -i "${finalPath}" -ss 00:00:01.000 -vframes 1 -update 1 "${outP}"`;
                execSync(ffmpegCommand, { stdio: 'pipe' }); // 使用 'pipe' 避免在 console 中輸出大量 ffmpeg log

                if (fs.existsSync(outP)) {
                    previewPath = outP;
                    console.log('[step1] Video preview frame extracted successfully =>', previewPath);
                } else {
                     console.warn('[step1] Failed to extract video preview frame.');
                }
            } catch (eVid) {
                console.error('[Video middle frame extraction error]', eVid.stderr ? eVid.stderr.toString() : eVid);
            }
        } else {
            previewPath = finalPath;
            try {
                console.log(`[step1] Indexing local file for vector search: ${finalPath}`);
                await indexImageVector(finalPath, newFile.id.toString());
                publicImageUrl = await convertAndUpload(finalPath, ext, newFile.id);
            } catch (eProcessing) {
                console.error('[step1 image processing/indexing error]', eProcessing);
                if (!publicImageUrl) {
                    publicImageUrl = null;
                }
            }
        }

        const pdfName = `certificate_${newFile.id}.pdf`;
        const pdfPath = path.join(CERT_DIR, pdfName);
        const stampImg = path.join(__dirname, '../../public/stamp.png');

        try {
            await generateCertificatePDF({
                name: user.realName,
                dob: user.birthDate,
                phone: user.phone,
                address: user.address,
                email: user.email,
                title,
                fileName: req.file.originalname,
                fingerprint,
                ipfsHash,
                txHash,
                serial: user.serialNumber,
                mimetype: mimeType,
                issueDate: new Date(newFile.createdAt).toLocaleString(),
                filePath: previewPath, // filePath 現在可能是影片截圖
                stampImagePath: fs.existsSync(stampImg) ? stampImg : null
            }, pdfPath);
        } catch (ePDF) {
            console.error('[step1 generateCertificatePDF error]', ePDF);
        }

        return res.json({
            message: '上傳成功並完成證書PDF',
            fileId: newFile.id,
            pdfUrl: `/api/protect/certificates/${newFile.id}`,
            fingerprint,
            ipfsHash,
            txHash,
            defaultPassword,
            publicImageUrl
        });

    } catch (err) {
        console.error('[step1 error]', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ error: 'STEP1_ERROR', detail: err.message });
    }
});

router.post('/step2', async (req, res) => {
    try {
        const { fileId } = req.body || {};
        if (!fileId) {
            return res.status(400).json({ error: 'MISSING_FILE_ID', message: '請提供 fileId' });
        }

        const fileRec = await File.findByPk(fileId);
        if (!fileRec) {
            return res.status(404).json({ error: 'FILE_NOT_FOUND', message: '無此 File ID' });
        }

        fileRec.status = 'uploaded';
        await fileRec.save();

        return res.json({ message: 'Step2 處理完成', fileId: fileRec.id });
    } catch (e) {
        console.error('[step2 error]', e);
        return res.status(500).json({ error: 'STEP2_ERROR', detail: e.message });
    }
});

router.get('/certificates/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const pdfPath = path.join(CERT_DIR, `certificate_${fileId}.pdf`);
        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({ error: 'NOT_FOUND', message: '證書PDF不存在' });
        }
        return res.download(pdfPath, `KaiShield_Certificate_${fileId}.pdf`);
    } catch (e) {
        console.error('[certificates error]', e);
        return res.status(500).json({ error: 'CERT_DOWNLOAD_ERROR', detail: e.message });
    }
});


//===================================================================
// [10] GET /protect/scan/:fileId => 侵權掃描 (影片/圖片整合優化版)
//===================================================================
router.get('/scan/:fileId', async (req, res) => {
    let tempFramePaths = []; // 用於收集所有暫存的影片畫格路徑
    try {
        const fileId = req.params.fileId;
        const fileRec = await File.findByPk(fileId);
        if (!fileRec) {
            return res.status(404).json({ error: 'FILE_NOT_FOUND', message: '無此File ID' });
        }

        // --- 檔案探測邏輯 (保持不變) ---
        let localPath = null;
        const baseName = `imageForSearch_${fileRec.id}`;
        const possibleExtensions = [
            '.jpg', '.png', '.gif', '.bmp', '.webp', '.jpeg',
            '.mp4', '.mov', '.avi', '.mkv'
        ];
        for (const ext of possibleExtensions) {
            const testPath = path.join(UPLOAD_BASE_DIR, `${baseName}${ext}`);
            if (fs.existsSync(testPath)) {
                localPath = testPath;
                console.log(`[Scan Route] File found by probing: ${localPath}`);
                break;
            }
        }
        if (!localPath) {
            const attemptedPathForLog = path.join(UPLOAD_BASE_DIR, `${baseName}[.jpg, .png, etc.]`);
            console.error(`[Scan Route] CRITICAL: File not found for id ${fileId}. Probed for path: ${attemptedPathForLog}`);
            return res.status(404).json({
                error: 'LOCAL_FILE_NOT_FOUND',
                message: '系統內部錯誤：掃描時找不到對應的本地原始檔案。',
            });
        }
        
        const isVideo = fileRec.mimetype.startsWith('video/');
        let allLinks = [];
        let matchedImages = [];
        
        // ★★★★★ 【核心修改：區分影片和圖片的掃描流程】 ★★★★★
        if (isVideo) {
            // --- 影片掃描流程 ---
            console.log(`[Scan Route] Video file detected. Starting multi-frame scan for fileId: ${fileId}`);
            
            // 1. 從影片中抽取多個關鍵畫格
            tempFramePaths = await extractKeyFrames(localPath, 3); // 抽取3個畫格
            if (tempFramePaths.length === 0) {
                console.error(`[Scan Route] Could not extract any frames from video: ${localPath}`);
                // 即使沒有畫格，也繼續後續流程，只是不會有圖片比對結果
            }

            // 2. 對每一個畫格進行掃描和比對
            for (const framePath of tempFramePaths) {
                console.log(`[Scan Route] Processing frame: ${path.basename(framePath)}`);
                const frameBuffer = fs.readFileSync(framePath);

                // a. 執行 TinEye, Google Vision, RapidAPI 掃描
                const report = await infringementScan({ buffer: frameBuffer }); // 影片掃描不使用檔名作為關鍵字
                if (report.tineye?.success) allLinks.push(...report.tineye.links);
                if (report.vision?.success) allLinks.push(...report.vision.links);
                if (report.rapid) {
                    Object.values(report.rapid).forEach(platformResult => {
                        if (platformResult?.success) allLinks.push(...platformResult.links);
                    });
                }
                
                // b. 執行向量比對
                const vectorRes = await searchImageByVector(framePath, { topK: 4 });
                if (vectorRes && Array.isArray(vectorRes.results)) {
                    // 處理向量比對結果的邏輯與圖片流程相同
                    for (const r of vectorRes.results) {
                         if (r.id && r.id.toString() === fileId.toString()) continue;
                         // ... (處理匹配到的圖片，加入 matchedImages 陣列)
                        if(r.id){
                            const matchedFile = await File.findByPk(r.id);
                            if (matchedFile) {
                                let matchedPublicImagePath = null;
                                const publicImagesDir = path.join(UPLOAD_BASE_DIR, 'publicImages');
                                const filePrefix = `public_${r.id}_`;
                                if (fs.existsSync(publicImagesDir)) {
                                    try {
                                        const allPublicFiles = fs.readdirSync(publicImagesDir);
                                        const matchedFilename = allPublicFiles.find(f => f.startsWith(filePrefix));
                                        if (matchedFilename) {
                                            matchedPublicImagePath = path.join(publicImagesDir, matchedFilename);
                                        }
                                    } catch (eDir) {
                                        console.error(`[Scan Route] Error reading publicImages directory:`, eDir);
                                    }
                                }
                                if(matchedPublicImagePath) {
                                    const b64 = fs.readFileSync(matchedPublicImagePath).toString('base64');
                                    matchedImages.push({ id: r.id, score: r.score, base64: b64 });
                                } else {
                                     console.warn(`[Scan Route] Matched public image file not found locally. Searched for pattern: public_${r.id}_*`);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // --- 圖片掃描流程 (原邏輯) ---
            console.log(`[Scan Route] Image file detected. Starting standard scan for fileId: ${fileId}`);
            try {
                const fileBuffer = fs.readFileSync(localPath);
                const cleanFilename = Buffer.from(fileRec.filename, 'latin1').toString('utf8');
                const keyword = cleanFilename.replace(/\.[^/.]+$/, "") || fileRec.fingerprint;
                console.log(`[Scan Route] Starting infringementScan for fileId: ${fileId} with keyword: "${keyword}"`);

                const report = await infringementScan({ buffer: fileBuffer, keyword: keyword });

                if (report.tineye?.success) allLinks.push(...report.tineye.links);
                if (report.vision?.success) allLinks.push(...report.vision.links);
                 if (report.rapid) {
                    for (const platform of Object.keys(report.rapid)) {
                        const platformResult = report.rapid[platform];
                        if (platformResult?.success && Array.isArray(platformResult.links)) {
                            allLinks.push(...platformResult.links);
                            console.log(`[Scan Route] Added ${platformResult.links.length} links from RapidAPI-${platform}.`);
                        }
                    }
                }
            } catch (eScan) {
                console.error(`[Scan Route] Critical error during infringementScan for fileId ${fileId}:`, eScan);
            }
             // 執行向量比對
            try {
                const vectorRes = await searchImageByVector(localPath, { topK: 4 });
                if (vectorRes && Array.isArray(vectorRes.results)) {
                     for (const r of vectorRes.results) {
                        if (r.id && r.id.toString() === fileId.toString()) continue;
                        if(r.id){
                            const matchedFile = await File.findByPk(r.id);
                            if (matchedFile) {
                                let matchedPublicImagePath = null;
                                const publicImagesDir = path.join(UPLOAD_BASE_DIR, 'publicImages');
                                const filePrefix = `public_${r.id}_`;
                                if (fs.existsSync(publicImagesDir)) {
                                    try {
                                        const allPublicFiles = fs.readdirSync(publicImagesDir);
                                        const matchedFilename = allPublicFiles.find(f => f.startsWith(filePrefix));
                                        if (matchedFilename) {
                                            matchedPublicImagePath = path.join(publicImagesDir, matchedFilename);
                                        }
                                    } catch (eDir) {
                                        console.error(`[Scan Route] Error reading publicImages directory:`, eDir);
                                    }
                                }
                                if(matchedPublicImagePath) {
                                    const b64 = fs.readFileSync(matchedPublicImagePath).toString('base64');
                                    // 避免重複加入
                                    if (!matchedImages.some(img => img.id === r.id)) {
                                        matchedImages.push({ id: r.id, score: r.score, base64: b64 });
                                    }
                                } else {
                                     console.warn(`[Scan Route] Matched public image file not found locally. Searched for pattern: public_${r.id}_*`);
                                }
                            }
                        }
                    }
                }
            } catch (eVec) {
                console.error('[searchImageByVector error]', eVec);
            }
        }
        
        // --- 統一處理後續流程 ---
        const allManual = getAllManualLinks();
        const manKey = `fingerprint_${fileRec.fingerprint}`;
        const manualLinks = allManual[manKey] || [];
        allLinks.push(...manualLinks);

        const unique = [...new Set(allLinks)].filter(isValidLink);
        const truncated = unique.slice(0, ENGINE_MAX_LINKS);
        console.log(`[Scan Route] Total unique links found: ${truncated.length}`);

        fileRec.status = 'scanned';
        fileRec.infringingLinks = JSON.stringify(truncated);
        await fileRec.save();
        
        // ... (產生報告 PDF 和回傳 response 的邏輯保持不變) ...
        const scanPdfName = `scanReport_${fileRec.id}.pdf`;
        const scanPdfPath = path.join(REPORTS_DIR, scanPdfName);
        // ...
         await generateScanPDFWithMatches({
            file: fileRec,
            suspiciousLinks: truncated,
            matchedImages, // 這是從向量搜尋來的
            stampImagePath: fs.existsSync(path.join(__dirname, '../../public/stamp.png')) ? path.join(__dirname, '../../public/stamp.png') : null,
            screenshotPath: null // 簡化邏輯，暫不自動截圖
        }, scanPdfPath);

        return res.json({
            message: '掃描完成 => PDF已產生',
            suspiciousLinks: truncated,
            scanReportUrl: `/api/protect/scanReports/${fileRec.id}`
        });

    } catch (e) {
        console.error('[scan error]', e);
        return res.status(500).json({ error: 'SCAN_ERROR', detail: e.message });
    } finally {
        // ★★★★★ 【清理暫存檔案】 ★★★★★
        if (tempFramePaths.length > 0) {
            console.log('[Scan Route] Cleaning up temporary frames...');
            for (const framePath of tempFramePaths) {
                try {
                    if (fs.existsSync(framePath)) {
                        fs.unlinkSync(framePath);
                    }
                } catch (eClean) {
                    console.warn(`[Scan Route] Failed to clean up temp frame ${framePath}:`, eClean);
                }
            }
        }
    }
});


// ... (其餘路由 /scanReports/:fileId, /flickerProtectFile 等保持不變) ...
router.get('/scanReports/:fileId', async(req,res)=>{
    try {
        const fileId= req.params.fileId;
        const pdfPath = path.join(REPORTS_DIR, `scanReport_${fileId}.pdf`);
        if(!fs.existsSync(pdfPath)){
            return res.status(404).json({ error:'NOT_FOUND', message:'掃描報告不存在' });
        }
        return res.download(pdfPath, `KaiShield_ScanReport_${fileId}.pdf`);
    } catch(e){
        console.error('[scanReports error]', e);
        return res.status(500).json({ error:e.message });
    }
});

router.post('/protect', upload.single('file'), async(req,res)=>{
    return res.json({ success:true, message:'(示範) direct protect route' });
});

router.get('/scanLink', async(req,res)=>{
    try {
        const pageUrl = req.query.url;
        if(!pageUrl){
            return res.status(400).json({ error:'MISSING_URL', message:'請提供 ?url=xxxx' });
        }
        const tmpFilePath = path.join(UPLOAD_BASE_DIR, `linkImage_${Date.now()}.jpg`);
        const { aggregatorResult, vectorResult, mainImgUrl, error } = await aggregatorSearchLink(pageUrl, tmpFilePath, true);
        if(!aggregatorResult){
            return res.json({
                message: '聚合搜尋或抓主圖失敗',
                aggregatorResult: null,
                vectorResult: null,
                mainImgUrl,
                error: error ? error.message : ''
            });
        }

        let suspiciousLinks = [];
        if(aggregatorResult.tineye?.success) suspiciousLinks.push(...aggregatorResult.tineye.links);
        if(aggregatorResult.vision?.success) suspiciousLinks.push(...aggregatorResult.vision.links);
        if (aggregatorResult.rapid) {
            for (const platform of Object.keys(aggregatorResult.rapid)) {
                const platformResult = aggregatorResult.rapid[platform];
                if (platformResult?.success && Array.isArray(platformResult.links)) {
                    suspiciousLinks.push(...platformResult.links);
                } else {
                    console.warn(`[ScanLink Route] RapidAPI-${platform} search failed. Error: ${platformResult?.error}`);
                }
            }
        }
        suspiciousLinks = [...new Set(suspiciousLinks)].filter(isValidLink);

        let matchedImages = [];
        if(vectorResult && vectorResult.results){
            for(const r of vectorResult.results){
                if(r.url){
                    try {
                        const resp = await axios.get(r.url, { responseType:'arraybuffer' });
                        const b64 = Buffer.from(resp.data).toString('base64');
                        matchedImages.push({
                            url: r.url,
                            score: r.score,
                            base64: b64
                        });
                    } catch(eDn){
                        console.warn('[scanLink vector item dl fail]', eDn);
                    }
                }
            }
        }

        const pdfName = `linkScanReport_${Date.now()}.pdf`;
        const pdfPath = path.join(REPORTS_DIR, pdfName);
        let shotPath = null;
        try {
            const browser = await launchBrowser();
            const page = await browser.newPage();
            await page.goto(pageUrl, { waitUntil:'domcontentloaded', timeout:30000 }).catch(()=>{});
            const shotDir = path.join(UPLOAD_BASE_DIR, 'infringe_shots');
            if(!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive:true });
            shotPath = path.join(shotDir, `link_${Date.now()}.png`);
            await page.screenshot({ path: shotPath, fullPage:true }).catch(()=>{});
            await browser.close();
        } catch(e){
            console.error('[scanLink screenshot error]', e);
        }

        await generateScanPDFWithMatches({
            file: { id: '(linkScan)', filename: pageUrl, fingerprint: '(no-fingerprint)', status: 'scanned_by_link' },
            suspiciousLinks,
            matchedImages,
            stampImagePath: fs.existsSync(path.join(__dirname, '../../public/stamp.png')) ? path.join(__dirname, '../../public/stamp.png') : null,
            screenshotPath: shotPath
        }, pdfPath);

        try {
            if(fs.existsSync(tmpFilePath)){ fs.unlinkSync(tmpFilePath); }
        } catch(eDel){
            console.error('[scanLink] remove tmp file fail =>', eDel);
        }

        return res.json({
            message: '連結掃描完成',
            mainImgUrl,
            suspiciousLinks,
            pdfReport: `/api/protect/scanReportsLink/${pdfName}`
        });
    } catch(e){
        console.error('[GET /scanLink] error =>', e);
        return res.status(500).json({ error:'SCAN_LINK_ERROR', detail:e.message });
    }
});

router.get('/scanReportsLink/:pdfName', async(req,res)=>{
    try {
        const pdfName = req.params.pdfName;
        const pdfPath = path.join(REPORTS_DIR, pdfName);
        if(!fs.existsSync(pdfPath)){ return res.status(404).json({ error:'NOT_FOUND', message:'報告不存在' }); }
        return res.download(pdfPath, pdfName);
    } catch(e){
        console.error('[GET /scanReportsLink/:pdfName] =>', e);
        return res.status(500).json({ error:e.message });
    }
});

router.post('/flickerProtectFile', async (req, res) => {
    try {
        const { fileId } = req.body;
        if(!fileId) { return res.status(400).json({ error: 'MISSING_FILE_ID', message:'請提供 fileId' }); }
        const fileRec = await File.findByPk(fileId);
        if(!fileRec) { return res.status(404).json({ error:'FILE_NOT_FOUND', message:'無此 File ID' }); }
        const ext= path.extname(fileRec.filename)||'';
        const localPath= path.join(UPLOAD_BASE_DIR, `imageForSearch_${fileRec.id}${ext}`);
        if(!fs.existsSync(localPath)){ return res.status(404).json({ error:'LOCAL_FILE_NOT_FOUND', message:'原始檔不在本機，無法做防錄製' }); }
        const isImage = !!fileRec.mimetype.match(/^image\/(jpe?g|png|gif|bmp|webp)$/i);

        let sourcePath = localPath;

        if (isImage) {
            const tempPath = path.join(UPLOAD_BASE_DIR, `tempIMG_${Date.now()}.mp4`);
            try {
                const cmd = `ffmpeg -y -loop 1 -i "${localPath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" -t 5 -c:v libx264 -r 30 -movflags +faststart "${tempPath}"`;
                execSync(cmd, { stdio: 'inherit' });
                sourcePath = tempPath;
            } catch (eImg) {
                console.error('[flickerProtectFile] convert img->video error =>', eImg);
                return res.status(500).json({ error:'IMG_TO_VIDEO_ERROR', detail:eImg.message });
            }
        }
        const protectedName = `flicker_protected_${fileRec.id}_${Date.now()}.mp4`;
        const protectedPath = path.join(UPLOAD_BASE_DIR, protectedName);
        try {
            await flickerEncodeAdvanced(sourcePath, protectedPath, {
                useSubPixelShift : true, useMaskOverlay : true, maskOpacity : 0.25, maskFreq : 5, maskSizeRatio : 0.3,
                useRgbSplit : true, useAiPerturb : false, flickerFps : 120, noiseStrength : 25,
                colorCurveDark : '0/0 0.5/0.2 1/1', colorCurveLight : '0/0 0.5/0.4 1/1', drawBoxSeconds : 5
            });
        } catch(eFlicker){
            console.error('[flickerProtectFile] flickerEncodeAdvanced fail =>', eFlicker);
            return res.status(500).json({ error:'INTERNAL_ERROR', detail: 'FFmpeg / flickerEncode failure: ' + (eFlicker.message || 'unknown') });
        }
        if(isImage && sourcePath !== localPath && fs.existsSync(sourcePath)){ fs.unlinkSync(sourcePath); }
        const protectedFileUrl = `/api/protect/flickerDownload?file=${encodeURIComponent(protectedName)}`;
        return res.json({ message:'已成功產生多層次防錄製檔案', protectedFileUrl });
    } catch(e){
        console.error('[POST /flickerProtectFile] error =>', e);
        return res.status(500).json({ error:'INTERNAL_ERROR', detail:e.message });
    }
});

router.get('/flickerDownload', (req, res)=>{
    try {
        const file = req.query.file;
        if(!file){ return res.status(400).send('Missing ?file='); }
        const filePath = path.join(UPLOAD_BASE_DIR, file);
        if(!fs.existsSync(filePath)){ return res.status(404).send('File not found'); }
        return res.download(filePath, `KaiShield_Flicker_${file}`);
    } catch(e){
        console.error('[flickerDownload error]', e);
        return res.status(500).send('Download error: ' + e.message);
    }
});


module.exports = router;
