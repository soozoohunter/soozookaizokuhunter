/**
 * express/routes/protect.js (最終整合 + 防錄製功能(Advanced) + aggregator/fallback + 向量檢索 + scanLink 等)
 *
 * 注意：
 * - 已將原本的 flickerEncode() 替換為 flickerEncodeAdvanced()，並於 /flickerProtectFile 改用多層次防錄製參數。
 * - 其餘 aggregator / fallback / 向量檢索 / PDF 產生 / 掃描等程式碼大部分維持原狀，只在必要處做小幅修正 (如修正 N→n)。
 * - 主要修正：在 (E) RGB 分離的部分，將 `interleave=0` 改為 `mergeplanes=0x001020,format=rgb24`。
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

// ========== Models ==========
const { User, File } = require('../models');

// ========== Services/Utils ==========
const fingerprintService = require('../services/fingerprintService');
const ipfsService        = require('../services/ipfsService');
const chain              = require('../utils/chain');
const { convertAndUpload } = require('../utils/convertAndUpload');
const { extractKeyFrames }  = require('../utils/extractFrames');
const { searchImageByVector } = require('../utils/vectorSearch');
const { generateScanPDFWithMatches } = require('../services/pdfService');

//----------------------------------------
// [★ 新增] 讀取 express/data/manual_links.json => 取得人工搜圖連結
//----------------------------------------
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
ensureUploadDirs(); // 啟動時先執行一次

// ★ 新增你的公開網域 (請自行改為你實際的網域)
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

//----------------------------------------
// [2] 內嵌字體 (PDF 中文) - Puppeteer 產 PDF 時嵌入
//----------------------------------------
let base64TTF = '';
try {
  const fontBuf = fs.readFileSync(path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf'));
  base64TTF = fontBuf.toString('base64');
  console.log('[Font] Loaded NotoSansTC-VariableFont_wght.ttf as base64');
} catch(eFont){
  console.error('[Font] Loading error =>', eFont);
}

//----------------------------------------
// [3] 建立 Puppeteer Browser (headless = true)
//----------------------------------------
async function launchBrowser(){
  console.log('[launchBrowser] starting stealth browser...');
  return puppeteer.launch({
    headless: true,
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

//--------------------------------------------------
// [★ 新增] 儲存截圖與 HTML Dump 到 /app/debugShots (若有需要除錯)
//--------------------------------------------------
async function saveDebugInfo(page, tag){
  try {
    const debugDir = '/app/debugShots';  // 確保 docker-compose.yml 有掛載或可寫
    const now = Date.now();

    // 截圖
    const shotPath = path.join(debugDir, `debug_${tag}_${now}.png`);
    await page.screenshot({ path: shotPath, fullPage:true }).catch(err=>{
      console.warn('[saveDebugInfo] screenshot fail =>', err);
    });

    // HTML dump
    const html = await page.content().catch(()=>'<html>cannot get content</html>');
    const htmlPath = path.join(debugDir, `debug_${tag}_${now}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    const currentUrl = page.url();
    const currentTitle = await page.title().catch(()=>null);
    console.log(`[saveDebugInfo] => screenshot=${shotPath}, url=${currentUrl}, title=${currentTitle}`);
  } catch(e){
    console.warn('[saveDebugInfo] error =>', e);
  }
}

//----------------------------------------
// [4] 產生「原創證書 PDF」(Puppeteer)
//----------------------------------------
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

    // ========== 嵌字體 ==========
    const embeddedFont = base64TTF ? `
      @font-face {
        font-family: "NotoSansTCVar";
        src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
      }
    ` : '';

    // ========== 圖片/影片預覽標籤 ==========
    let previewTag='';
    if(filePath && fs.existsSync(filePath) && mimeType.startsWith('image')){
      const ext= path.extname(filePath).replace('.','');
      const b64= fs.readFileSync(filePath).toString('base64');
      previewTag= `<img src="data:image/${ext};base64,${b64}" style="max-width:300px; margin:10px auto; display:block;" />`;
    } else if(mimeType && mimeType.startsWith('video')){
      previewTag= `<p style="color:gray;">(短影片檔案示意，不顯示畫面)</p>`;
    }

    // ========== 浮水印 (stamp) ==========
    const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
      ? `<img src="file://${stampImagePath}" style="position:absolute; top:40px; left:40px; width:100px; opacity:0.3; transform:rotate(45deg);" alt="stamp" />`
      : '';

    // ========== HTML ==========
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

    // 產出 PDF
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

//----------------------------------------
// [5] 產生「侵權偵測報告 PDF」(Puppeteer) - (原始示範, 最終多用 generateScanPDFWithMatches)
//----------------------------------------
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
      <h3>可疑連結 (FB/IG/YouTube/TikTok/搜圖):</h3>
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

//--------------------------------------
// aggregator / fallback (Ginifab / Bing / TinEye / Baidu) 相關函式
//--------------------------------------
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

//-- ginifab (本檔合併寫法) --
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
      console.warn('[tryGinifabWithUrl] can not find link');
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

// -- Goto ginifab via google (fallback)
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
      console.warn('[gotoGinifabViaGoogle] ginifab link not found');
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

// -- iOS/Android/Desktop 複合嘗試
async function tryGinifabUploadLocal_iOS(page, localImagePath){
  console.log('[tryGinifabUploadLocal_iOS]...');
  try {
    await tryCloseAd(page);
    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(!uploadLink) throw new Error('No "上傳本機圖片" link for iOS flow');
    await uploadLink.click();
    await page.waitForTimeout(1000);

    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if(!chooseFileBtn) throw new Error('No "選擇檔案" link for iOS flow');
    await chooseFileBtn.click();
    await page.waitForTimeout(1000);

    const [photoBtn] = await page.$x("//a[contains(text(),'照片圖庫') or contains(text(),'相簿') or contains(text(),'Photo Library')]");
    if(!photoBtn) throw new Error('No "照片圖庫/相簿/Photo Library" link');
    await photoBtn.click();
    await page.waitForTimeout(1500);

    const [finishBtn] = await page.$x("//a[contains(text(),'完成') or contains(text(),'Done') or contains(text(),'OK')]");
    if(finishBtn){
      await finishBtn.click();
      await page.waitForTimeout(1000);
    }

    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('No input[type=file] for iOS flow');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_iOS] success');
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal_iOS] fail =>', e.message);
    return false;
  }
}

async function tryGinifabUploadLocal_Android(page, localImagePath){
  console.log('[tryGinifabUploadLocal_Android]...');
  try {
    await tryCloseAd(page);

    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(!uploadLink) throw new Error('No "上傳本機圖片" link for Android flow');
    await uploadLink.click();
    await page.waitForTimeout(1000);

    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if(!chooseFileBtn) throw new Error('No "選擇檔案" link for Android flow');
    await chooseFileBtn.click();
    await page.waitForTimeout(2000);

    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('No input[type=file] for Android flow');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_Android] success');
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal_Android] fail =>', e.message);
    return false;
  }
}

async function tryGinifabUploadLocal_Desktop(page, localImagePath){
  console.log('[tryGinifabUploadLocal_Desktop]...');
  try {
    await tryCloseAd(page);
    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'Upload from PC')]");
    if(!uploadLink) throw new Error('No "上傳本機圖片" link for Desktop flow');
    await uploadLink.click();
    await page.waitForTimeout(1000);

    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('No input[type=file] in Desktop flow');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_Desktop] success');
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal_Desktop] fail =>', e.message);
    return false;
  }
}

async function tryGinifabUploadLocalAllFlow(page, localImagePath){
  console.log('[tryGinifabUploadLocalAllFlow] => start iOS/Android/Desktop attempts...');
  let ok = await tryGinifabUploadLocal_iOS(page, localImagePath);
  if(ok) return true;

  ok = await tryGinifabUploadLocal_Android(page, localImagePath);
  if(ok) return true;

  ok = await tryGinifabUploadLocal_Desktop(page, localImagePath);
  if(ok) return true;

  // 全部失敗
  return false;
}

/** aggregatorSearchGinifab => 一次整合 Bing/TinEye/Baidu **/
async function aggregatorSearchGinifab(browser, localImagePath, publicImageUrl) {
  console.log('[aggregatorSearchGinifab] => local=', localImagePath, ' url=', publicImageUrl);
  const ret = {
    bing:   { success:false, links:[] },
    tineye: { success:false, links:[] },
    baidu:  { success:false, links:[] }
  };

  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.setDefaultTimeout(30000);
    await page.setDefaultNavigationTimeout(30000);

    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await page.waitForTimeout(2000);
    await saveDebugInfo(page, 'ginifab_afterGoto');

    let successLocal = await tryGinifabUploadLocalAllFlow(page, localImagePath);
    if(!successLocal){
      console.log('[aggregatorSearchGinifab] local upload fail => try URL approach...');
      successLocal = await tryGinifabWithUrl(page, publicImageUrl);
    }

    if(!successLocal) {
      console.warn('[aggregatorSearchGinifab] local+URL both fail => goto google fallback...');
      await saveDebugInfo(page, 'ginifab_failBeforeGoogle');
      await page.close().catch(()=>{});
      page = null;

      const newPage = await browser.newPage();
      await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      await newPage.setDefaultTimeout(30000);
      await newPage.setDefaultNavigationTimeout(30000);

      const googleOk = await gotoGinifabViaGoogle(newPage, publicImageUrl);
      if(!googleOk) {
        console.warn('[aggregatorSearchGinifab] google path also fail => give up aggregator');
        await saveDebugInfo(newPage, 'ginifab_googleAlsoFail');
        await newPage.close().catch(()=>{});
        return ret;
      } else {
        page = newPage;
        let ok2 = await tryGinifabUploadLocalAllFlow(page, localImagePath);
        if(!ok2){
          ok2 = await tryGinifabUploadLocal(page, localImagePath);
        }
        if(!ok2){
          ok2 = await tryGinifabWithUrl(page, publicImageUrl);
        }
        if(!ok2){
          console.warn('[aggregatorSearchGinifab] still fail => aggregator stop');
          await saveDebugInfo(page, 'ginifab_secondFail');
          await page.close().catch(()=>{});
          return ret;
        }
      }
    }

    // 順序點 Bing / TinEye / Baidu
    const engList = [
      { key:'bing',   label:['微軟必應','Bing'] },
      { key:'tineye', label:['錫眼睛','TinEye'] },
      { key:'baidu',  label:['百度','Baidu'] }
    ];
    for(const eng of engList){
      try {
        const newTab = new Promise(resolve=>{
          browser.once('targetcreated', async t => resolve(await t.page()));
        });
        await page.evaluate((labels)=>{
          const as= [...document.querySelectorAll('a')];
          for(const lab of labels){
            const found= as.find(x=> x.innerText.includes(lab));
            if(found){ found.click(); return; }
          }
        }, eng.label);

        const popup= await newTab;
        await popup.waitForTimeout(3000);
        await saveDebugInfo(popup, `agg_${eng.key}_popup`);

        let hrefs= await popup.$$eval('a', as=> as.map(a=> a.href));
        hrefs= hrefs.filter(h=>
          h && !h.includes('ginifab') &&
          !h.includes('bing.com') &&
          !h.includes('tineye.com') &&
          !h.includes('baidu.com')
        );
        ret[eng.key].links= hrefs.slice(0,5);
        ret[eng.key].success= ret[eng.key].links.length>0;
        await popup.close();
      } catch(eSub){
        console.error(`[Ginifab aggregator sub-engine fail => ${eng.key}]`, eSub);
        if(page) await saveDebugInfo(page, `agg_${eng.key}_error`);
      }
    }

  } catch(e){
    console.error('[aggregatorSearchGinifab fail]', e);
    if(page) await saveDebugInfo(page, 'aggregatorSearchGinifab_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

/** directSearchBing, directSearchTinEye, directSearchBaidu, fallbackDirectEngines **/
async function directSearchBing(browser, imagePath){
  console.log('[directSearchBing] =>', imagePath);
  const ret={ success:false, links:[] };
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.setDefaultTimeout(30000);
    await page.setDefaultNavigationTimeout(30000);

    await page.goto('https://www.bing.com/images', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await saveDebugInfo(page, 'bing_afterGoto');
    await page.waitForTimeout(2000);

    const [fileChooser] = await Promise.all([
      page.waitForFileChooser({ timeout:10000 }),
      page.click('#sb_sbi').catch(()=>{})
    ]);
    await fileChooser.accept([imagePath]);
    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    await page.waitForTimeout(3000);

    let hrefs= await page.$$eval('a', as=> as.map(a=> a.href));
    hrefs= hrefs.filter(h=> h && !h.includes('bing.com'));
    ret.links= [...new Set(hrefs)].slice(0,5);
    ret.success= ret.links.length>0;
  } catch(e){
    console.error('[directSearchBing] fail =>', e);
    if(page) await saveDebugInfo(page, 'bing_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

async function directSearchTinEye(browser, imagePath){
  console.log('[directSearchTinEye] =>', imagePath);
  const ret={ success:false, links:[] };
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.setDefaultTimeout(30000);
    await page.setDefaultNavigationTimeout(30000);

    await page.goto('https://tineye.com/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await saveDebugInfo(page, 'tineye_afterGoto');
    await page.waitForTimeout(1500);

    const fileInput= await page.waitForSelector('input[type=file]', { timeout:8000 });
    await fileInput.uploadFile(imagePath);
    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    await page.waitForTimeout(2000);

    let hrefs= await page.$$eval('a', as=> as.map(a=> a.href));
    hrefs= hrefs.filter(h=> h && !h.includes('tineye.com'));
    ret.links= [...new Set(hrefs)].slice(0,5);
    ret.success= ret.links.length>0;
  } catch(e){
    console.error('[directSearchTinEye] fail =>', e);
    if(page) await saveDebugInfo(page, 'tineye_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

async function directSearchBaidu(browser, imagePath){
  console.log('[directSearchBaidu] =>', imagePath);
  const ret={ success:false, links:[] };
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.setDefaultTimeout(30000);
    await page.setDefaultNavigationTimeout(30000);

    await page.goto('https://graph.baidu.com/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await saveDebugInfo(page, 'baidu_afterGoto');
    await page.waitForTimeout(2000);

    const fInput= await page.$('input[type=file]');
    if(!fInput) throw new Error('Baidu input[type=file] not found');
    await fInput.uploadFile(imagePath);
    await page.waitForTimeout(5000);

    // 再嘗試 image.baidu.com
    try {
      await page.goto('https://image.baidu.com/', {
        waitUntil:'domcontentloaded', timeout:20000
      });
      await page.waitForTimeout(2000);
      const cameraBtn = await page.$('span.soutu-btn');
      if(cameraBtn){
        await cameraBtn.click();
        await page.waitForTimeout(1500);
      }
      const f2 = await page.$('input[type=file]');
      if(f2){
        await f2.uploadFile(imagePath);
        await page.waitForTimeout(3000);
      }
    } catch(e2){
      console.warn('[directSearchBaidu second approach error]', e2);
    }

    let hrefs= await page.$$eval('a', as=> as.map(a=> a.href));
    hrefs= hrefs.filter(h=> h && !h.includes('baidu.com'));
    ret.links= [...new Set(hrefs)].slice(0,5);
    ret.success= ret.links.length>0;
  } catch(e){
    console.error('[directSearchBaidu] fail =>', e);
    if(page) await saveDebugInfo(page, 'baidu_error');
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

async function fallbackDirectEngines(imagePath){
  let final = { bing:[], tineye:[], baidu:[] };
  let browser;
  try {
    browser = await launchBrowser();
    console.log('[fallbackDirectEngines] browser launched...');

    const [rBing, rTine, rBai] = await Promise.all([
      directSearchBing(browser, imagePath),
      directSearchTinEye(browser, imagePath),
      directSearchBaidu(browser, imagePath)
    ]);
    final.bing   = rBing.links;
    final.tineye = rTine.links;
    final.baidu  = rBai.links;

    console.log('[fallbackDirectEngines] done =>', final);
  } catch(e){
    console.error('[fallbackDirectEngines error]', e);
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
  return final;
}

async function doSearchEngines(localFilePath, aggregatorFirst=true, aggregatorImageUrl=''){
  console.log('[doSearchEngines] aggregatorFirst=', aggregatorFirst, ' aggregatorUrl=', aggregatorImageUrl);
  const ret = { bing:{}, tineye:{}, baidu:{} };
  let aggregatorOk=false;

  if(aggregatorFirst && aggregatorImageUrl){
    let browser;
    try {
      browser = await launchBrowser();
      const aggRes = await aggregatorSearchGinifab(browser, localFilePath, aggregatorImageUrl);
      console.log('[doSearchEngines] aggregator =>', aggRes);
      const total = aggRes.bing.links.length
                  + aggRes.tineye.links.length
                  + aggRes.baidu.links.length;
      if(total>0){
        aggregatorOk= true;
        ret.bing   = { links: aggRes.bing.links,   success:true };
        ret.tineye = { links: aggRes.tineye.links, success:true };
        ret.baidu  = { links: aggRes.baidu.links,  success:true };
      }
    } catch(eAg){
      console.error('[aggregatorSearchGinifab error]', eAg);
    } finally {
      if(browser) await browser.close().catch(()=>{});
    }

    if(!aggregatorOk){
      console.log('[doSearchEngines] aggregator fail => fallbackDirect');
      const fb = await fallbackDirectEngines(localFilePath);
      ret.bing   = { links: fb.bing,    success: fb.bing.length>0 };
      ret.tineye = { links: fb.tineye,  success: fb.tineye.length>0 };
      ret.baidu  = { links: fb.baidu,   success: fb.baidu.length>0 };
    }
  } else {
    console.log('[doSearchEngines] fallbackDirect only');
    const fb = await fallbackDirectEngines(localFilePath);
    ret.bing   = { links: fb.bing,    success: fb.bing.length>0 };
    ret.tineye = { links: fb.tineye,  success: fb.tineye.length>0 };
    ret.baidu  = { links: fb.baidu,   success: fb.baidu.length>0 };
  }
  return ret;
}

//--------------------------------------
// [★ 新增] fetchLinkMainImage => 抓 og:image 或最大 <img>
//--------------------------------------
async function fetchLinkMainImage(pageUrl){
  try {
    new URL(pageUrl);
  } catch(e) {
    throw new Error('INVALID_URL: ' + pageUrl);
  }

  // 先嘗試 axios + cheerio
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
    console.warn('[fetchLinkMainImage] axios fail =>', eAxios.message);
  }

  // fallback: Puppeteer
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

    // 沒 og:image => 遍歷 <img> 找最大
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

//--------------------------------------
// [★ 新增] aggregatorSearchLink => 「給連結 → 抓主圖 → aggregator/fallback + 向量檢索」
//--------------------------------------
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

  // (3) aggregator => fallback
  aggregatorResult = await doSearchEngines(localFilePath, true, mainImgUrl);

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

//--------------------------------------
// [7] POST /protect/step1 => 上傳 & 產生證書
//--------------------------------------
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

    // 短影片上傳檢查
    if(isVideo && !isUnlimited){
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ error:'UPGRADE_REQUIRED', message:'短影片需升級付費帳戶' });
    }

    // 找或建 user
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

    // ===============【副檔名檢查/修正】===============
    let ext = path.extname(req.file.originalname) || '';
    let realExt = '';  // 根據 mimeType 推測的「正確副檔名」
    if(mimeType.includes('png'))  realExt='.png';
    else if(mimeType.includes('jpeg')) realExt='.jpg';
    else if(mimeType.includes('jpg'))  realExt='.jpg';
    else if(mimeType.includes('gif'))  realExt='.gif';
    else if(mimeType.includes('bmp'))  realExt='.bmp';
    else if(mimeType.includes('webp')) realExt='.webp';
    else if(mimeType.includes('mp4'))  realExt='.mp4';
    else if(mimeType.includes('mov'))  realExt='.mov';
    else if(mimeType.includes('avi'))  realExt='.avi';
    else if(mimeType.includes('mkv'))  realExt='.mkv';
    // 若 ext 與 realExt 不同 => 以 realExt 為準
    if(realExt && realExt.toLowerCase() !== ext.toLowerCase()){
      console.log(`[step1] Detected extension mismatch => origin=${ext} => corrected=${realExt}`);
      ext = realExt;
    }

    // fingerprint
    const buf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(buf);

    // 查重
    const exist= await File.findOne({ where:{ fingerprint }});
    if(exist){
      console.log(`[step1] detected duplicated => File ID=${exist.id}`);
      // 用 exist.filename 來推算舊檔案副檔名
      const extExist = path.extname(exist.filename) || ext;
      const finalPathExist = path.join(UPLOAD_BASE_DIR, `imageForSearch_${exist.id}${extExist}`);
      const pdfExistPath   = path.join(CERT_DIR, `certificate_${exist.id}.pdf`);

      if(isUnlimited){
        // 若本地舊檔案 /uploads/ 不存在 => 用新的檔案補上
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
          // 舊檔案還在 => 新檔案直接刪除
          console.log('[step1] old file found => remove new file');
          fs.unlinkSync(req.file.path);
        }

        // 如果證書 PDF 不在 => 補做一次
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
              mimeType   : (isVideo ? 'video/mp4' : 'image/jpeg'),
              issueDate  : new Date().toLocaleString(),
              filePath   : fs.existsSync(finalPathExist) ? finalPathExist : null,
              stampImagePath: fs.existsSync(stampImg) ? stampImg : null
            }, pdfExistPath);
          } catch(ePDF){
            console.error('[step1 re-gen PDF error]', ePDF);
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

    // 移動檔案至 /uploads
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
      // 嘗試擷取中間幀做證書預覽
      try {
        const durSec= parseFloat(
          execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalPath}"`)
            .toString().trim()
        )||9999;
        if(durSec<=30){
          const mid= Math.floor(durSec/2);
          const outP= path.join(UPLOAD_BASE_DIR, `preview_${newFile.id}.png`);
          console.log('[DEBUG] trying to extract middle frame =>', outP);

          // 避免 deprecated pixel format 警告 => 加上 scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p
          execSync(`ffmpeg -y -i "${finalPath}" -ss ${mid} -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" -frames:v 1 "${outP}"`);

          if(fs.existsSync(outP)){
            previewPath= outP;
          }
        }
      } catch(eVid){
        console.error('[Video middle frame error]', eVid);
      }
    } else {
      // 圖檔
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

//--------------------------------------
// [8] GET /protect/certificates/:fileId => 下載 PDF
//--------------------------------------
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

//--------------------------------------
// [9] GET /protect/scan/:fileId => 侵權掃描
//--------------------------------------
router.get('/scan/:fileId', async(req,res)=>{
  try {
    const fileId= req.params.fileId;
    const fileRec= await File.findByPk(fileId);
    if(!fileRec){
      return res.status(404).json({ error:'FILE_NOT_FOUND', message:'無此File ID' });
    }

    // (1) 多平台文字爬蟲 (示範) - 可自行擴充
    let suspiciousLinks=[];
    const query= fileRec.filename || fileRec.fingerprint;
    if(process.env.RAPIDAPI_KEY){
      try {
        const rTT= await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search',{
          params:{ keywords: query, region:'us', count:'3' },
          headers:{ 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY },
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
      fileRec.status='scanned';
      fileRec.infringingLinks= JSON.stringify(suspiciousLinks);
      await fileRec.save();
      return res.json({
        message:'原始檔不存在 => 僅文字爬蟲',
        suspiciousLinks
      });
    }

    let allLinks=[...suspiciousLinks];
    const isVideo= !!ext.match(/\.(mp4|mov|avi|mkv|webm)$/i);

    function getPublicUrl(fileId, extension){
      return `${PUBLIC_HOST}/uploads/imageForSearch_${fileId}${extension}`;
    }

    let matchedImages = [];

    if(isVideo){
      // 短影片(<=30s) => 抽幀 => aggregator/fallback
      try {
        const durSec= parseFloat(
          execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`)
            .toString().trim()
        )||9999;
        if(durSec<=30){
          const frameDir= path.join(UPLOAD_BASE_DIR, `frames_${fileRec.id}`);
          if(!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);

          const frames= await extractKeyFrames(localPath, frameDir, 10,5);
          for(const fPath of frames){
            const baseName = path.basename(fPath);
            const frameUrl = `${PUBLIC_HOST}/uploads/frames_${fileRec.id}/${baseName}`;
            const engineRes= await doSearchEngines(fPath, true, frameUrl);
            allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
          }
        }
      } catch(eVid){
        console.error('[scan video aggregator error]', eVid);
      }
    } else {
      // 單張圖片 => aggregator + fallback + 向量檢索
      const publicUrl= getPublicUrl(fileRec.id, ext);
      const engineRes= await doSearchEngines(localPath, true, publicUrl);
      allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);

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
    }

    // (3) [新增] 讀取人工連結
    const allManual = getAllManualLinks();
    const manKey = `fingerprint_${fileRec.fingerprint}`;
    const manualLinks = allManual[manKey] || [];
    allLinks.push(...manualLinks);

    // 去重
    const unique= [...new Set(allLinks)];
    fileRec.status='scanned';
    fileRec.infringingLinks= JSON.stringify(unique);
    await fileRec.save();

    // 產出掃描報告 PDF
    const scanPdfName= `scanReport_${fileRec.id}.pdf`;
    const scanPdfPath= path.join(REPORTS_DIR, scanPdfName);
    const stampPath= path.join(__dirname, '../../public/stamp.png');

    await generateScanPDFWithMatches({
      file: fileRec,
      suspiciousLinks: unique,
      matchedImages,
      stampImagePath: fs.existsSync(stampPath)? stampPath:null
    }, scanPdfPath);

    /**
     * 不再在掃描後直接刪除 localPath，以免後續需要再做 flickerProtect。
     * 如果確定不需要再做防錄製，可自行選擇在這裡清理。
     */

    return res.json({
      message:'圖搜+文字爬蟲+向量檢索完成 => PDF已產生',
      suspiciousLinks: unique,
      scanReportUrl:`/api/protect/scanReports/${fileRec.id}`
    });

  } catch(e){
    console.error('[scan error]', e);
    return res.status(500).json({ error:'SCAN_ERROR', detail:e.message });
  }
});

//--------------------------------------
// [10] GET /protect/scanReports/:fileId => 下載報告 PDF
//--------------------------------------
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

//--------------------------------------
// (可選) /protect => DEMO (原本示範)
//--------------------------------------
router.post('/protect', upload.single('file'), async(req,res)=>{
  return res.json({ success:true, message:'(示範) direct protect route' });
});

//--------------------------------------
// [★ 新增] GET /protect/scanLink?url=xxx
//--------------------------------------
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
    suspiciousLinks = [...new Set(suspiciousLinks)];

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
        : null
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

//--------------------------------------
// [★ 新增] GET /protect/scanReportsLink/:pdfName
//--------------------------------------
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

/* 
 * ------------------------------------------------------------------------------------
 * (以下為防錄製 進階版) - flickerEncodeAdvanced + /flickerProtectFile
 * ------------------------------------------------------------------------------------
 */

//---------------------------------------------
// 改良增強版 flickerEncodeAdvanced：整合多層次擾動
// **修改重點**：在 (E) RGB 分離處改用 mergeplanes=0x001020
//---------------------------------------------
function flickerEncodeAdvanced(
  inputPath,
  outputPath,
  {
    useSubPixelShift = true,       // 預設開啟子像素平移
    useMaskOverlay   = true,
    maskOpacity      = 0.3,
    maskFreq         = 5,
    maskSizeRatio    = 0.3,
    useRgbSplit      = true,
    useAiPerturb     = false,
    flickerFps       = 120,
    noiseStrength    = 30,
    colorCurveDark   = '0/0 0.5/0.2 1/1',
    colorCurveLight  = '0/0 0.5/0.4 1/1',
    drawBoxSeconds   = 5
  } = {}
){
  return new Promise((resolve, reject) => {
    let encodeInput = inputPath;
    let aiTempPath  = '';

    // (A) 若開啟 AI 對抗擾動 => 先呼叫 python 腳本 (示例)
    if(useAiPerturb){
      try {
        aiTempPath = path.join(
          path.dirname(outputPath),
          'tmpAi_' + Date.now() + '.mp4'
        );
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, {
          stdio: 'inherit',
        });
        encodeInput = aiTempPath; 
      } catch (errPy) {
        console.error('[AI Perturb Error]', errPy);
        encodeInput = inputPath; // 若失敗則用原檔
      }
    }

    // (B) 第一階段濾鏡
    const step1Filter = [
      `format=rgb24`,
      `colorchannelmixer=1.2:0.2:0.2:0:0:0:0:0:0:0:0:0:0:0:0:1`,
      `curves=r='${colorCurveDark}':g='${colorCurveDark}':b='${colorCurveLight}'`,
      `noise=c0s=${noiseStrength}:c0f=t+u`,
      // drawbox: 每 drawBoxSeconds 秒顯示 1 秒 (以 time t 為基準)
      `drawbox=x=0:y=0:w='iw/2':h='ih/4':color=black@0.2:enable='lt(mod(t,${drawBoxSeconds}),1)'`
    ].join(',');

    const filters = [`[0:v]${step1Filter}[preOut]`];

    // (C) 子像素平移 => frame index n => mod(n,2)
    let labelA = 'preOut';
    if(useSubPixelShift){
      filters.push(`
        [preOut]split=2[subA][subB];
        [subA]pad=iw+1:ih:1:0:black[sA];
        [subB]pad=iw+1:ih:0:0:black[sB];
        [sA][sB]blend=all_expr='if(eq(mod(n,2),0),A,B)'[subShiftOut]
      `);
      labelA = 'subShiftOut';
    }

    // (D) maskOverlay => frame index n => mod(n,maskFreq)
    let labelB = labelA;
    if(useMaskOverlay){
      filters.push(`
        color=size=16x16:color=red@${maskOpacity}[maskSrc];
        [${labelA}]scale=trunc(iw/2)*2:trunc(ih/2)*2[baseScaled];
        [maskSrc]scale=iw*${maskSizeRatio}:ih*${maskSizeRatio}[maskBig];
        [baseScaled][maskBig]
        overlay=x='(W-w)/2':y='(H-h)/2'
                :enable='lt(mod(n,${maskFreq}),1)'
        [maskedOut]
      `);
      labelB = 'maskedOut';
    }

    // (E) **重點修正：RGB 分離後合併 → mergeplanes=0x001020**
    let finalLabel = labelB;
    if(useRgbSplit){
      filters.push(`
        [${labelB}]split=3[r_in][g_in][b_in];
        [r_in]extractplanes=r[rp];
        [g_in]extractplanes=g[gp];
        [b_in]extractplanes=b[bp];
        [rp]pad=iw:ih:0:0:black[rout];
        [gp]pad=iw:ih:0:0:black[gout];
        [bp]pad=iw:ih:0:0:black[bout];
        [rout][gout][bout]mergeplanes=0x001020,format=rgb24[rgbSplitOut]
      `);
      finalLabel = 'rgbSplitOut';
    }

    // (F) fps=xxx + yuv420p
    filters.push(`
      [${finalLabel}]fps=${flickerFps},format=yuv420p[finalOut]
    `);

    const filterComplex = filters.map(x => x.trim()).join(';');

    // (G) ffmpeg參數
    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,
      '-filter_complex', filterComplex,
      '-map', '[finalOut]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-r', `${flickerFps}`,
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputPath
    ];

    console.log('[flickerEncodeAdvanced] ffmpeg =>', ffmpegArgs.join(' '));
    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    ff.on('error', err => {
      reject(err);
    });
    ff.on('close', code => {
      if(aiTempPath && fs.existsSync(aiTempPath)){
        fs.unlinkSync(aiTempPath);
      }
      if(code === 0){
        resolve(true);
      } else {
        reject(new Error(`FFmpeg exited with code=${code}`));
      }
    });
  });
}

//--------------------------------------
// [★ 新版防錄製] POST /protect/flickerProtectFile
//--------------------------------------
router.post('/flickerProtectFile', async (req, res) => {
  try {
    const { fileId } = req.body;
    if(!fileId) {
      return res.status(400).json({ error: 'MISSING_FILE_ID', message:'請提供 fileId' });
    }

    // 1) 找 DB
    const fileRec = await File.findByPk(fileId);
    if(!fileRec) {
      return res.status(404).json({ error:'FILE_NOT_FOUND', message:'無此 File ID' });
    }

    // 2) 檔案是否存在
    const ext= path.extname(fileRec.filename)||'';
    const localPath= path.join(UPLOAD_BASE_DIR, `imageForSearch_${fileRec.id}${ext}`);
    if(!fs.existsSync(localPath)){
      return res.status(404).json({ error:'LOCAL_FILE_NOT_FOUND', message:'原始檔不在本機，無法做防側錄' });
    }

    // 3) 若是圖片 => 先轉 5 秒靜態影片
    const isImage = !!fileRec.filename.match(/\.(jpe?g|png|gif|bmp|webp)$/i);
    let sourcePath = localPath;

    if(isImage){
      const tempPath = path.join(UPLOAD_BASE_DIR, `tempIMG_${Date.now()}.mp4`);
      try {
        const cmd = `ffmpeg -y -loop 1 -i "${localPath}" -t 5 -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${tempPath}"`;
        console.log('[flickerProtectFile] convert image->video =>', cmd);
        execSync(cmd);
        sourcePath = tempPath;
      } catch(eImg){
        console.error('[flickerProtectFile] convert img->video error =>', eImg);
        return res.status(500).json({ error:'IMG_TO_VIDEO_ERROR', detail:eImg.message });
      }
    }

    // 4) 執行 flickerEncodeAdvanced
    const protectedName = `flicker_protected_${fileRec.id}_${Date.now()}.mp4`;
    const protectedPath = path.join(UPLOAD_BASE_DIR, protectedName);

    await flickerEncodeAdvanced(sourcePath, protectedPath, {
      useSubPixelShift : true,
      useMaskOverlay   : true,
      maskOpacity      : 0.25,
      maskFreq         : 5,
      maskSizeRatio    : 0.3,
      useRgbSplit      : true,
      useAiPerturb     : false, // 若要AI擾動 => true
      flickerFps       : 120,
      noiseStrength    : 25,
      colorCurveDark   : '0/0 0.5/0.2 1/1',
      colorCurveLight  : '0/0 0.5/0.4 1/1',
      drawBoxSeconds   : 5
    });

    // 若有 tempIMG => 刪除
    if(isImage && sourcePath !== localPath && fs.existsSync(sourcePath)){
      fs.unlinkSync(sourcePath);
    }

    // 5) 回傳可下載連結
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

//--------------------------------------
// 下載「防錄製」影片
//--------------------------------------
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
