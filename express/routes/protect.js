/**
 * express/routes/protect.js
 *
 * 整合「Google Vision、防側錄、多引擎圖搜、向量檢索、IPFS、區塊鏈上鍊、PDF產出」等功能的主路由
 */
const express = require('express');
const router = express.Router();
const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cheerio = require('cheerio');
const { execSync, spawnSync, spawn } = require('child_process');
const { Op } = require('sequelize');

const puppeteer    = require('puppeteer-extra');
const StealthPlugin= require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const ffmpeg      = require('fluent-ffmpeg');
const ffmpegPath  = require('ffmpeg-static');
if(ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// ========== Google Vision API ==========
// 改為直接呼叫 visionService.infringementScan
const { infringementScan } = require('../services/visionService');

// ========== Models ==========
const { User, File } = require('../models');

// ========== Services/Utils ==========
const fingerprintService  = require('../services/fingerprintService');
const ipfsService         = require('../services/ipfsService');
const chain               = require('../utils/chain');
const { convertAndUpload }= require('../utils/convertAndUpload');
const { extractKeyFrames }= require('../utils/extractFrames');
const { searchImageByVector } = require('../utils/vectorSearch');
const { generateScanPDFWithMatches } = require('../services/pdfService');
const tinEyeApi = require('../services/tineyeApiService');

// 上限: 各搜尋引擎總合可疑連結最大數量
// If the environment variable is not provided, default to 50
const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS || '50', 10);

// ** (重點) 新增：引用 flickerService.js **
const { flickerEncodeAdvanced } = require('../services/flickerService');

//----------------------------------------------------
// [★ 人工搜圖連結檔案] express/data/manual_links.json
//----------------------------------------------------
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

//----------------------------------------------------
// [1] 建立 /uploads /uploads/certificates /uploads/reports 目錄
//----------------------------------------------------
const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');
const CERT_DIR        = path.join(UPLOAD_BASE_DIR, 'certificates');
const REPORTS_DIR     = path.join(UPLOAD_BASE_DIR, 'reports');

function ensureUploadDirs(){
  try {
    [UPLOAD_BASE_DIR, CERT_DIR, REPORTS_DIR].forEach(dir => {
      if(!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[DEBUG] Created directory => ${dir}`);
      }
    });
  } catch(e) {
    console.error('[ensureUploadDirs error]', e);
  }
}
ensureUploadDirs();

// ★ 公開網域 (請自行改為你的正式域名)
const PUBLIC_HOST = 'https://suzookaizokuhunter.com';

// Multer: 上傳檔案大小上限 100MB
const upload = multer({
  dest: 'uploads/',
  limits:{ fileSize: 100 * 1024 * 1024 }
});

// 白名單 => 可免費上傳短影片
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

//----------------------------------------------------
// [2] 內嵌字體 (PDF 中文) - Puppeteer 時嵌入
//----------------------------------------------------
let base64TTF = '';
try {
  const fontBuf = fs.readFileSync(path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf'));
  base64TTF = fontBuf.toString('base64');
  console.log('[Font] Loaded NotoSansTC-VariableFont_wght.ttf as base64');
} catch(eFont){
  console.error('[Font] Loading error =>', eFont);
}

//----------------------------------------------------
// [3] Puppeteer Browser + /app/debugShots (除錯)
//----------------------------------------------------
const DEBUGSHOTS_DIR = '/app/debugShots';

function ensureDebugShotsDir(){
  try {
    if(!fs.existsSync(DEBUGSHOTS_DIR)){
      fs.mkdirSync(DEBUGSHOTS_DIR, { recursive:true });
      console.log(`[DEBUG] Created debugShots directory => ${DEBUGSHOTS_DIR}`);
    }
  } catch(err){
    console.error('[ensureDebugShotsDir error]', err);
  }
}
ensureDebugShotsDir();

async function launchBrowser(){
  // Mirror utils/browserHelper.js logic for determining headless mode
  const envHeadless = process.env.PPTR_HEADLESS ?? process.env.PUPPETEER_HEADLESS;
  const HEADLESS = envHeadless === 'false' ? false : true;
  console.log('[launchBrowser] starting stealth browser... headless=', HEADLESS);

  return puppeteer.launch({
    headless: HEADLESS ? 'new' : false,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args:[
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-blink-features=AutomationControlled'
    ],
    defaultViewport:{ width:1280, height:800 }
  });
}

async function saveDebugInfo(page, tag){
  try {
    const now = Date.now();
    const shotPath = path.join(DEBUGSHOTS_DIR, `debug_${tag}_${now}.png`);
    await page.screenshot({ path: shotPath, fullPage:true }).catch(err=>{
      console.warn('[saveDebugInfo] screenshot fail =>', err);
    });

    const html = await page.content().catch(()=>'<html>cannot get content</html>');
    const htmlPath = path.join(DEBUGSHOTS_DIR, `debug_${tag}_${now}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    const currentUrl = page.url();
    const currentTitle = await page.title().catch(()=>null);
    console.log(`[saveDebugInfo] => screenshot=${shotPath}, url=${currentUrl}, title=${currentTitle}`);
  } catch(e){
    console.warn('[saveDebugInfo] error =>', e);
  }
}

//----------------------------------------------------
// [★ 核心工具] 過濾掉明顯無效的 URL
//----------------------------------------------------
const INVALID_PREFIX_RE = /^(javascript:|data:)/i;
const INVALID_CHAR_RE = /\s/;
function isValidLink(str) {
  if (!str) return false;
  const trimmed = str.trim();
  if (INVALID_PREFIX_RE.test(trimmed) || INVALID_CHAR_RE.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

//----------------------------------------------------
// [4] 產生「原創證書 PDF」(Puppeteer)
//----------------------------------------------------
async function generateCertificatePDF(data, outputPath){
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

    let previewTag='';
    if(filePath && fs.existsSync(filePath) && mimeType.startsWith('image')){
      const ext= path.extname(filePath).replace('.','');
      const b64= fs.readFileSync(filePath).toString('base64');
      previewTag= `<img src="data:image/${ext};base64,${b64}" style="max-width:300px; margin:10px auto; display:block;" />`;
    } else if(mimeType && mimeType.startsWith('video')){
      previewTag= `<p style="color:gray;">(短影片檔示意，不顯示畫面)</p>`;
    }

    const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
      ? `<img src="file://${stampImagePath}" style="position:absolute; top:40px; left:40px; width:100px; opacity:0.3; transform:rotate(45deg);" alt="stamp" />`
      : '';

    const html= `
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
      .field { margin:4px 0; }
      .footer {
        text-align:center; margin-top:20px; color:#666; font-size:12px;
        position: relative; z-index: 99;
      }
      </style>
    </head>
    <body>
      ${stampTag}
      <h1>原創著作證明書</h1>
      <div class="field"><b>作者姓名：</b> ${name||''}</div>
      <div class="field"><b>生日：</b> ${dob||''}</div>
      <div class="field"><b>手機：</b> ${phone||''}</div>
      <div class="field"><b>地址：</b> ${address||''}</div>
      <div class="field"><b>Email：</b> ${email||''}</div>
      <div class="field"><b>作品標題：</b> ${title||''}</div>
      <div class="field"><b>檔名：</b> ${fileName||''}</div>
      <div class="field"><b>Fingerprint：</b> ${fingerprint||''}</div>
      <div class="field"><b>IPFS Hash：</b> ${ipfsHash||''}</div>
      <div class="field"><b>TxHash：</b> ${txHash||''}</div>
      <div class="field"><b>序號：</b> ${serial||''}</div>
      <div class="field"><b>檔案格式：</b> ${mimeType||''}</div>
      <div class="field"><b>發證時間：</b> ${issueDate||''}</div>
      <div style="margin-top:10px;">${previewTag}</div>
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
    console.log('[generateCertificatePDF] done =>', outputPath);

  } catch(err){
    console.error('[generateCertificatePDF error]', err);
    throw err;
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
}

//----------------------------------------------------
// [5] 產生「侵權偵測報告 PDF」(Puppeteer) - (基本示範)
//    (完整功能已移至 services/pdfService.js => generateScanPDFWithMatches)
//----------------------------------------------------
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

// ---------------------------------------------------------------------------
//                      aggregator/fallback 搜圖邏輯 (Ginifab / Bing / TinEye / Baidu)
// ---------------------------------------------------------------------------
async function tryCloseAd(page) {
  try {
    const closeBtnSelector = 'button.ad-close, .adCloseBtn, .close';
    await page.waitForTimeout(2000);
    const closeBtn = await page.$(closeBtnSelector);
    if(closeBtn){
      console.log('[tryCloseAd] found close button, clicking...');
      await closeBtn.click();
      await page.waitForTimeout(1000);
      return true;
    } else {
      console.log('[tryCloseAd] ad close button not found...');
      return false;
    }
  } catch(e){
    console.error('[tryCloseAd error]', e);
    return false;
  }
}

async function saveDebugInfoForAggregator(page, tag){
  return await saveDebugInfo(page, tag);
}

async function tryGinifabUploadLocal(page, localImagePath) {
  try {
    const uploadLink = await page.$x("//a[contains(text(),'上傳本機圖片')]");
    if(uploadLink.length) {
      await uploadLink[0].click();
      await page.waitForTimeout(1000);
    }
    const fileInput = await page.waitForSelector('input[type=file]', { timeout:5000 });
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal] upload success =>', localImagePath);
    return true;
  } catch(e) {
    console.warn('[tryGinifabUploadLocal] fail =>', e.message);
    return false;
  }
}

async function tryGinifabWithUrl(page, publicImageUrl) {
  try {
    const closedAd = await tryCloseAd(page);
    if(closedAd) console.log('[tryGinifabWithUrl] closed ad...');
    await page.waitForTimeout(1000);
    const linkFound = await page.evaluate(()=>{
      const link = [...document.querySelectorAll('a')]
        .find(a => a.innerText.includes('指定圖片網址'));
      if(link) {
        link.click();
        return true;
      }
      return false;
    });
    if(!linkFound) {
      console.warn('[tryGinifabWithUrl] can not find "指定圖片網址" link');
      return false;
    }
    await page.waitForSelector('input[type=text]', { timeout:5000 });
    await page.type('input[type=text]', publicImageUrl, { delay:50 });
    await page.waitForTimeout(1000);
    console.log('[tryGinifabWithUrl] typed URL =>', publicImageUrl);
    return true;
  } catch(e) {
    console.error('[tryGinifabWithUrl error]', e);
    return false;
  }
}

async function gotoGinifabViaGoogle(page, publicImageUrl){
  console.log('[gotoGinifabViaGoogle]');
  try {
    await page.goto('https://www.google.com', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await saveDebugInfo(page, 'google_afterGoto');
    await page.waitForTimeout(2000);

    const searchBox= await page.$('input[name="q"]');
    if(!searchBox){
      console.warn('[gotoGinifabViaGoogle] can not find google search box');
      return false;
    }
    await searchBox.type('圖搜引擎', { delay:50 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    const links = await page.$$eval('a', as => as.map(a => ({
      href: a.href || '',
      text: a.innerText || ''
    })));
    let target = links.find(x => x.href.includes('ginifab.com.tw'));
    if(!target){
      console.warn('[gotoGinifabViaGoogle] ginifab link not found in google results');
      return false;
    }
    console.log('[gotoGinifabViaGoogle] found =>', target.href);

    await page.goto(target.href, {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await saveDebugInfo(page, 'google_gotoGinifab');
    await page.waitForTimeout(2000);

    const ok = await tryGinifabWithUrl(page, publicImageUrl);
    return ok;
  } catch(e){
    console.error('[gotoGinifabViaGoogle error]', e);
    await saveDebugInfo(page, 'google_fail');
    return false;
  }
}


// 抓網頁主圖
async function fetchLinkMainImage(pageUrl){
  try {
    new URL(pageUrl);
  } catch(e) {
    throw new Error('INVALID_URL: ' + pageUrl);
  }

  // 先用 axios + cheerio
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

  // fallback puppeteer
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

    // 找最大 <img>
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
  let vectorResult     = null;
  let mainImgUrl       = '';

  // (1) 抓主圖
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

  // (2) 下載該主圖 => local
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

  // (3) 改為直接呼叫 infringementScan 取得 TinEye 及 Google Vision 結果
  const report = await infringementScan({ buffer: fs.readFileSync(localFilePath) });
  aggregatorResult = {
    bing:   { links: [], success: false },
    tineye: { links: report.tineye.links, success: report.tineye.success },
    baidu:  { links: [], success: false },
    vision: { links: report.vision.links, success: report.vision.success }
  };

  // (4) 向量檢索
  if(needVector){
    try {
      vectorResult = await searchImageByVector(localFilePath, { topK: 3 });
    } catch(eVec){
      console.error('[aggregatorSearchLink] vector fail =>', eVec);
    }
  }

  return { aggregatorResult, vectorResult, mainImgUrl };
}

//===========================================================
// [7] POST /protect/step1 => 上傳 & 產生證書
//===========================================================
router.post('/step1', upload.single('file'), async(req,res)=>{
  try {
    if(!req.file){
      return res.status(400).json({ error:'NO_FILE', message:'請上傳檔案' });
    }
    const { realName, birthDate, phone, address, email, title, agreePolicy }= req.body;
    if(!realName || !birthDate || !phone || !address || !email || !title){
      return res.status(400).json({ error:'MISSING_FIELDS', message:'必填資訊不足' });
    }
    if(agreePolicy!=='true'){
      return res.status(400).json({ error:'POLICY_REQUIRED', message:'請勾選服務條款' });
    }

    const mimeType   = req.file.mimetype;
    const isVideo    = mimeType.startsWith('video');
    const isUnlimited= ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);

    // 若非白名單 => 無法上傳影片
    if(isVideo && !isUnlimited){
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ error:'UPGRADE_REQUIRED', message:'短影片需升級付費帳戶' });
    }

    // 查/建 user
    let user= await User.findOne({ where:{ [Op.or]:[{email},{phone}] }});
    let defaultPassword=null;
    if(!user){
      const rawPass= phone+'@KaiShield';
      const hashed= await bcrypt.hash(rawPass,10);
      user= await User.create({
        username: phone,
        email, phone,
        password: hashed,
        realName, birthDate, address,
        serialNumber:'SN-'+Date.now(),
        role:'user',
        plan:'free'
      });
      defaultPassword= rawPass;
    }

    // 副檔名校正
    let ext = path.extname(req.file.originalname) || '';
    let realExt = '';
    if(mimeType.includes('png'))   realExt='.png';
    else if(mimeType.includes('jpeg')) realExt='.jpg';
    else if(mimeType.includes('jpg'))  realExt='.jpg';
    else if(mimeType.includes('gif'))  realExt='.gif';
    else if(mimeType.includes('bmp'))  realExt='.bmp';
    else if(mimeType.includes('webp')) realExt='.webp';
    else if(mimeType.includes('mp4'))  realExt='.mp4';
    else if(mimeType.includes('mov'))  realExt='.mov';
    else if(mimeType.includes('avi'))  realExt='.avi';
    else if(mimeType.includes('mkv'))  realExt='.mkv';
    if(realExt && realExt.toLowerCase() !== ext.toLowerCase()){
      console.log(`[step1] extension mismatch => origin=${ext} => corrected=${realExt}`);
      ext = realExt;
    }

    // fingerprint
    const buf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(buf);

    // 查重
    const exist= await File.findOne({ where:{ fingerprint }});
    if(exist){
      console.log(`[step1] duplicated => File ID=${exist.id}`);
      const extExist = path.extname(exist.filename) || ext;
      const finalPathExist = path.join(UPLOAD_BASE_DIR, `imageForSearch_${exist.id}${extExist}`);
      const pdfExistPath   = path.join(CERT_DIR, `certificate_${exist.id}.pdf`);

      if(isUnlimited){
        // 若舊檔案不在 => rename
        if(!fs.existsSync(finalPathExist)){
          console.log('[step1] older file missing => rename new file => finalPathExist');
          try {
            fs.renameSync(req.file.path, finalPathExist);
          } catch(eRen){
            if(eRen.code==='EXDEV'){
              fs.copyFileSync(req.file.path, finalPathExist);
              fs.unlinkSync(req.file.path);
            } else {
              throw eRen;
            }
          }
        } else {
          console.log('[step1] old file found => remove new file');
          fs.unlinkSync(req.file.path);
        }

        // 若證書 PDF 不存在 => 再產一次
        if(!fs.existsSync(pdfExistPath)){
          try {
            const oldUser = await User.findByPk(exist.user_id);
            const stampImg = path.join(__dirname, '../../public/stamp.png');
            await generateCertificatePDF({
              name : oldUser?.realName || '',
              dob  : oldUser?.birthDate || '',
              phone: oldUser?.phone || '',
              address: oldUser?.address || '',
              email : oldUser?.email || '',
              title,
              fileName  : exist.filename || req.file.originalname,
              fingerprint: exist.fingerprint,
              ipfsHash   : exist.ipfs_hash,
              txHash     : exist.tx_hash,
              serial     : oldUser?.serialNumber || '',
              mimeType   : (mimeType.startsWith('video') ? mimeType : 'image/jpeg'),
              issueDate  : new Date().toLocaleString(),
              filePath   : fs.existsSync(finalPathExist) ? finalPathExist : null,
              stampImagePath: fs.existsSync(stampImg) ? stampImg : null
            }, pdfExistPath);
          } catch(ePDF){
            console.error('[step1 re-generate PDF error]', ePDF);
          }
        }

        return res.json({
          message:'已上傳相同檔案(白名單允許重複)，並自動補齊缺失檔案。',
          fileId: exist.id,
          pdfUrl:`/api/protect/certificates/${exist.id}`,
          fingerprint: exist.fingerprint,
          ipfsHash: exist.ipfs_hash,
          txHash: exist.tx_hash,
          defaultPassword: null
        });
      } else {
        // 非白名單 => 不允許重複
        fs.unlinkSync(req.file.path);
        return res.status(409).json({ error:'FINGERPRINT_DUPLICATE', message:'此檔案已存在' });
      }
    }

    // IPFS
    let ipfsHash='';
    try {
      ipfsHash= await ipfsService.saveFile(buf);
    } catch(eIPFS){
      console.error('[step1 IPFS error]', eIPFS);
    }

    // 區塊鏈
    let txHash='';
    try {
      const rec= await chain.storeRecord(fingerprint, ipfsHash||'');
      txHash= rec?.transactionHash||'';
    } catch(eChain){
      console.error('[step1 chain error]', eChain);
    }

    const newFile= await File.create({
      user_id : user.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash : txHash,
      status  :'pending'
    });

    if(isVideo) user.uploadVideos=(user.uploadVideos||0)+1;
    else user.uploadImages=(user.uploadImages||0)+1;
    await user.save();

    // 移動檔案
    const finalPath= path.join(UPLOAD_BASE_DIR, `imageForSearch_${newFile.id}${ext}`);
    try {
      fs.renameSync(req.file.path, finalPath);
    } catch(eRen){
      if(eRen.code==='EXDEV'){
        fs.copyFileSync(req.file.path, finalPath);
        fs.unlinkSync(req.file.path);
      } else {
        throw eRen;
      }
    }

    // 若是圖片 => convertAndUpload => publicImageUrl
    let previewPath=null;
    let publicImageUrl=null;

    if(isVideo){
      // 抽中間幀
      try {
        const durSec= parseFloat(
          execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalPath}"`)
            .toString().trim()
        )||9999;
        if(durSec<=30){
          const mid= Math.floor(durSec/2);
          const outP= path.join(UPLOAD_BASE_DIR, `preview_${newFile.id}.png`);
          console.log('[DEBUG] trying to extract middle frame =>', outP);
          execSync(`ffmpeg -y -i "${finalPath}" -ss ${mid} -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" -frames:v 1 "${outP}"`);
          if(fs.existsSync(outP)){
            previewPath= outP;
          }
        }
      } catch(eVid){
        console.error('[Video middle frame error]', eVid);
      }
    } else {
      previewPath= finalPath;
      try {
        publicImageUrl = await convertAndUpload(finalPath, ext, newFile.id);
      } catch(eConv){
        console.error('[step1 convertAndUpload error]', eConv);
      }
    }

    // 產出證書 PDF
    const pdfName= `certificate_${newFile.id}.pdf`;
    const pdfPath= path.join(CERT_DIR, pdfName);
    const stampImg= path.join(__dirname, '../../public/stamp.png');

    try {
      await generateCertificatePDF({
        name : user.realName,
        dob  : user.birthDate,
        phone: user.phone,
        address: user.address,
        email : user.email,
        title,
        fileName  : req.file.originalname,
        fingerprint,
        ipfsHash,
        txHash,
        serial     : user.serialNumber,
        mimeType   : mimeType,
        issueDate  : new Date().toLocaleString(),
        filePath   : previewPath,
        stampImagePath: fs.existsSync(stampImg)? stampImg:null
      }, pdfPath);
    } catch(ePDF){
      console.error('[step1 generateCertificatePDF error]', ePDF);
    }

    return res.json({
      message : '上傳成功並完成證書PDF',
      fileId  : newFile.id,
      pdfUrl  : `/api/protect/certificates/${newFile.id}`,
      fingerprint,
      ipfsHash,
      txHash,
      defaultPassword,
      publicImageUrl
    });

  } catch(err){
    console.error('[step1 error]', err);
    return res.status(500).json({ error:'STEP1_ERROR', detail:err.message });
  }
});

//===========================================================
// [8] POST /protect/step2 => 處理 Step1 後續作業
//===========================================================
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

//===========================================================
// [9] GET /protect/certificates/:fileId => 下載 PDF
//===========================================================
router.get('/certificates/:fileId', async(req,res)=>{
  try {
    const fileId=req.params.fileId;
    const pdfPath  = path.join(CERT_DIR, `certificate_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ error:'NOT_FOUND', message:'證書PDF不存在' });
    }
    return res.download(pdfPath, `KaiKaiShield_Certificate_${fileId}.pdf`);
  } catch(e){
    console.error('[certificates error]', e);
    return res.status(500).json({ error:'CERT_DOWNLOAD_ERROR', detail:e.message });
  }
});

//===========================================================
// [10] GET /protect/scan/:fileId => 侵權掃描
//===========================================================
router.get('/scan/:fileId', async(req,res)=>{
  try {
    const fileId= req.params.fileId;
    const fileRec= await File.findByPk(fileId);
    if(!fileRec){
      return res.status(404).json({ error:'FILE_NOT_FOUND', message:'無此File ID' });
    }

    // (1) 多平台文字爬蟲 (示範)
    let suspiciousLinks=[];
    const query= fileRec.filename || fileRec.fingerprint;
    if(process.env.RAPIDAPI_KEY){
      try {
        const rTT= await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search',{
          params:{ keywords: query, region:'us', count:'3' },
          headers:{
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
          },
          timeout:10000
        });
        const items= rTT.data?.videos||[];
        items.forEach(v=>{ if(v.link) suspiciousLinks.push(v.link); });
      } catch(eTT){
        console.error('[scan Tiktok error]', eTT);
      }
    }

    // (2) 檔案是否存在
    const ext= path.extname(fileRec.filename)||'';
    const localPath= path.join(UPLOAD_BASE_DIR, `imageForSearch_${fileRec.id}${ext}`);
    if(!fs.existsSync(localPath)){
      // 檔不在 => 只做文字爬蟲
      fileRec.status='scanned';
      fileRec.infringingLinks= JSON.stringify(suspiciousLinks);
      await fileRec.save();
      return res.json({
        message:'原始檔不存在 => 僅文字爬蟲',
        suspiciousLinks
      });
    }

    let allLinks=[...suspiciousLinks];
    let matchedImages = [];

    // 直接呼叫 infringementScan
    try {
      const fileBuffer = fs.readFileSync(localPath);
      const report = await infringementScan({ buffer: fileBuffer });
      if (report.tineye?.success) allLinks.push(...report.tineye.links);
      if (report.vision?.success) allLinks.push(...report.vision.links);
    } catch(eScan) {
      console.error('[scan infringementScan error]', eScan);
    }

    // 向量檢索
    try {
      const vectorRes = await searchImageByVector(localPath, { topK: 3 });
      if(vectorRes && vectorRes.results){
        for(const r of vectorRes.results){
          if(r.url){
            try {
              const resp = await axios.get(r.url, { responseType:'arraybuffer' });
              const b64 = Buffer.from(resp.data).toString('base64');
              matchedImages.push({
                id: r.id,
                score: r.score,
                base64: b64
              });
            } catch(eDn){
              console.error('[scan] download matched url fail =>', r.url, eDn);
            }
          }
        }
      }
    } catch(eVec){
      console.error('[searchImageByVector error]', eVec);
    }

    // (3) 讀取人工連結
    const allManual = getAllManualLinks();
    const manKey = `fingerprint_${fileRec.fingerprint}`;
    const manualLinks = allManual[manKey] || [];
    allLinks.push(...manualLinks);

    // ★去重 + 過濾無效連結
    const unique= [...new Set(allLinks)].filter(isValidLink);
    const truncated = unique.slice(0, ENGINE_MAX_LINKS);

    fileRec.status='scanned';
    fileRec.infringingLinks= JSON.stringify(truncated);
    await fileRec.save();

    // 產出掃描報告 PDF
    const scanPdfName= `scanReport_${fileRec.id}.pdf`;
    const scanPdfPath= path.join(REPORTS_DIR, scanPdfName);
    const stampPath= path.join(__dirname, '../../public/stamp.png');

    let shotPath = null;
    if (truncated.length > 0) {
      const browser = await launchBrowser();
      try {
        const page = await browser.newPage();
        await page.goto(truncated[0], { waitUntil:'domcontentloaded', timeout:30000 }).catch(()=>{});
        const shotDir = path.join(UPLOAD_BASE_DIR, 'infringe_shots');
        if(!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive:true });
        shotPath = path.join(shotDir, `file_${fileRec.id}_${Date.now()}.png`);
        await page.screenshot({ path: shotPath, fullPage:true }).catch(()=>{});
      } finally {
        await browser.close().catch(()=>{});
      }
    }

    await generateScanPDFWithMatches({
      file: fileRec,
      suspiciousLinks: truncated,
      matchedImages,
      stampImagePath: fs.existsSync(stampPath)? stampPath:null,
      screenshotPath: shotPath
    }, scanPdfPath);

    return res.json({
      message:'圖搜+文字爬蟲+向量檢索+Google Vision完成 => PDF已產生',
      suspiciousLinks: truncated,
      scanReportUrl:`/api/protect/scanReports/${fileRec.id}`
    });

  } catch(e){
    console.error('[scan error]', e);
    return res.status(500).json({ error:'SCAN_ERROR', detail:e.message });
  }
});

//===========================================================
// [11] GET /protect/scanReports/:fileId => 下載報告 PDF
//===========================================================
router.get('/scanReports/:fileId', async(req,res)=>{
  try {
    const fileId= req.params.fileId;
    const pdfPath   = path.join(REPORTS_DIR, `scanReport_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ error:'NOT_FOUND', message:'掃描報告不存在' });
    }
    return res.download(pdfPath, `KaiShield_ScanReport_${fileId}.pdf`);
  } catch(e){
    console.error('[scanReports error]', e);
    return res.status(500).json({ error:e.message });
  }
});

// --- (可選) /protect => DEMO ---
router.post('/protect', upload.single('file'), async(req,res)=>{
  return res.json({ success:true, message:'(示範) direct protect route' });
});

// --- [★ 新增] GET /protect/scanLink?url=xxx ---
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
    if(aggregatorResult.bing?.links)   suspiciousLinks.push(...aggregatorResult.bing.links);
    if(aggregatorResult.tineye?.links) suspiciousLinks.push(...aggregatorResult.tineye.links);
    if(aggregatorResult.baidu?.links)  suspiciousLinks.push(...aggregatorResult.baidu.links);
    if(aggregatorResult.vision?.links) suspiciousLinks.push(...aggregatorResult.vision.links);
    // ★過濾無效連結
    suspiciousLinks = [...new Set(suspiciousLinks)].filter(isValidLink);

    let matchedImages = [];
    if(vectorResult && vectorResult.results){
      for(const r of vectorResult.results){
        if(r.url){
          try {
            const resp = await axios.get(r.url, { responseType:'arraybuffer' });
            const b64  = Buffer.from(resp.data).toString('base64');
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
      file: {
        id: '(linkScan)',
        filename: pageUrl,
        fingerprint: '(no-fingerprint)',
        status: 'scanned_by_link'
      },
      suspiciousLinks,
      matchedImages,
      stampImagePath: fs.existsSync(path.join(__dirname, '../../public/stamp.png'))
        ? path.join(__dirname, '../../public/stamp.png')
        : null,
      screenshotPath: shotPath
    }, pdfPath);

    // 清理暫存
    try {
      if(fs.existsSync(tmpFilePath)){
        fs.unlinkSync(tmpFilePath);
      }
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

// --- [★ 新增] GET /protect/scanReportsLink/:pdfName ---
router.get('/scanReportsLink/:pdfName', async(req,res)=>{
  try {
    const pdfName = req.params.pdfName;
    const pdfPath = path.join(REPORTS_DIR, pdfName);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ error:'NOT_FOUND', message:'報告不存在' });
    }
    return res.download(pdfPath, pdfName);
  } catch(e){
    console.error('[GET /scanReportsLink/:pdfName] =>', e);
    return res.status(500).json({ error:e.message });
  }
});

//===========================================================
// [★ 防錄製 /flickerProtectFile POST]
//===========================================================
router.post('/flickerProtectFile', async (req, res) => {
  try {
    const { fileId } = req.body;
    if(!fileId) {
      return res.status(400).json({ error: 'MISSING_FILE_ID', message:'請提供 fileId' });
    }

    const fileRec = await File.findByPk(fileId);
    if(!fileRec) {
      return res.status(404).json({ error:'FILE_NOT_FOUND', message:'無此 File ID' });
    }

    const ext= path.extname(fileRec.filename)||'';
    const localPath= path.join(UPLOAD_BASE_DIR, `imageForSearch_${fileRec.id}${ext}`);
    if(!fs.existsSync(localPath)){
      return res.status(404).json({ error:'LOCAL_FILE_NOT_FOUND', message:'原始檔不在本機，無法做防錄製' });
    }

    const isImage = !!fileRec.filename.match(/\.(jpe?g|png|gif|bmp|webp)$/i);
    let sourcePath = localPath;

    // 若是圖片 => 先轉成 MP4
    if (isImage) {
      const tempPath = path.join(UPLOAD_BASE_DIR, `tempIMG_${Date.now()}.mp4`);
      try {
        // scale filter 確保寬高都是偶數
        const cmd =
          `ffmpeg -y -loop 1 -i "${localPath}" ` +
          `-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" ` +
          `-t 5 -c:v libx264 -r 30 -movflags +faststart "${tempPath}"`;
        console.log('[flickerProtectFile] convert image->video =>', cmd);
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
        useSubPixelShift : true,
        useMaskOverlay   : true,
        maskOpacity      : 0.25,
        maskFreq         : 5,
        maskSizeRatio    : 0.3,
        useRgbSplit      : true,
        useAiPerturb     : false,
        flickerFps       : 120,
        noiseStrength    : 25,
        colorCurveDark   : '0/0 0.5/0.2 1/1',
        colorCurveLight  : '0/0 0.5/0.4 1/1',
        drawBoxSeconds   : 5
      });
    } catch(eFlicker){
      console.error('[flickerProtectFile] flickerEncodeAdvanced fail =>', eFlicker);
      return res.status(500).json({
        error:'INTERNAL_ERROR',
        detail: 'FFmpeg / flickerEncode failure: ' + (eFlicker.message || 'unknown')
      });
    }

    // 刪除暫存 MP4（若有）
    if(isImage && sourcePath !== localPath && fs.existsSync(sourcePath)){
      fs.unlinkSync(sourcePath);
    }

    const protectedFileUrl = `/api/protect/flickerDownload?file=${encodeURIComponent(protectedName)}`;
    return res.json({
      message:'已成功產生多層次防錄製檔案',
      protectedFileUrl
    });

  } catch(e){
    console.error('[POST /flickerProtectFile] error =>', e);
    return res.status(500).json({ error:'INTERNAL_ERROR', detail:e.message });
  }
});

//===========================================================
// GET /protect/flickerDownload => 下載「防錄製」影片
//===========================================================
router.get('/flickerDownload', (req, res)=>{
  try {
    const file = req.query.file;
    if(!file){
      return res.status(400).send('Missing ?file=');
    }
    const filePath = path.join(UPLOAD_BASE_DIR, file);
    if(!fs.existsSync(filePath)){
      return res.status(404).send('File not found');
    }
    return res.download(filePath, `KaiShield_Flicker_${file}`);
  } catch(e){
    console.error('[flickerDownload error]', e);
    return res.status(500).send('Download error: ' + e.message);
  }
});

module.exports = router;
