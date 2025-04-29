/**
 * express/routes/protect.js (最終整合+更詳盡除錯紀錄 + 小幅修正)
 *
 * - Step1: 上傳檔案 => fingerprint, IPFS, 區塊鏈 => 產生「原創證書 PDF」
 * - 短影片(≤30秒) => 抽幀 => aggregator(Ginifab) + fallback(Bing/TinEye/Baidu)
 * - 針對 FB/IG/YouTube/TikTok 做文字爬蟲(示範)
 * - PDF 檔名: certificate_{fileId}.pdf / scanReport_{fileId}.pdf
 *
 * [本檔案調整項目]
 * 1. Puppeteer headless => true (防舊版Chromium不支援 'new')
 * 2. 預設 aggregatorFirst = true (先走Ginifab)
 * 3. 增加關鍵 console.log 幫助排查錯誤
 * 4. 新增 const PUBLIC_HOST = 'https://suzookaizokuhunter.com'，並在 /scan/:fileId 最後自動刪除暫存檔
 * 5. 若「白名單使用者重複上傳同一檔案」且之前的 PDF 或本地檔不見時，會重新補齊/產生。
 * 6. ★ 新增多階段嘗試：先直入 Ginifab，若遇到廣告且無法關閉 -> 關頁 -> Google 搜尋 Ginifab -> 再試一次。
 * 7. ★ 新增「優先嘗試本機上傳」的 aggregatorSearchGinifab 流程 (若失敗才改用指定圖片網址+Google fallback)
 *************************************************************/

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs   = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { execSync } = require('child_process');
const { Op } = require('sequelize');

// ========== Models ==========
const { User, File } = require('../models');

// ========== Services/Utils ==========
const fingerprintService = require('../services/fingerprintService');
const ipfsService        = require('../services/ipfsService');
const chain              = require('../utils/chain');

// ffmpeg: 抽影格
const ffmpeg      = require('fluent-ffmpeg');
const ffmpegPath  = require('ffmpeg-static');
if(ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
const { extractKeyFrames } = require('../utils/extractFrames');

// Puppeteer + Stealth
const puppeteer    = require('puppeteer-extra');
const StealthPlugin= require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

//----------------------------------------------------
// [1] 建立 /uploads /uploads/certificates /uploads/reports
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
// 開始前執行一次
ensureUploadDirs();

// ★ 新增你的公開網域，讓 aggregator 能存取到檔案
const PUBLIC_HOST = 'https://suzookaizokuhunter.com';

// Multer: 上限 100MB
// (保留你原先的設定: dest='uploads/')
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
let base64TTF='';
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
    headless: true,  // 改用true，避免舊Chromium不支援 'new'
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

//----------------------------------------
// [4] 產生「原創證書 PDF」(Puppeteer)
//----------------------------------------
async function generateCertificatePDF(data, outputPath){
  console.log('[generateCertificatePDF] =>', outputPath);
  let browser;
  try {
    console.log('[generateCertificatePDF] about to launch browser...');
    browser = await launchBrowser();
    console.log('[generateCertificatePDF] launched, new page...');
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
    } else if(mimeType.startsWith('video')){
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
    console.log('[generateCertificatePDF] rendering HTML => length=', html.length);
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
    if(browser) {
      console.log('[generateCertificatePDF] closing browser...');
      await browser.close().catch(()=>{});
    }
  }
}

//----------------------------------------
// [5] 產生「侵權偵測報告 PDF」(Puppeteer)
//----------------------------------------
async function generateScanPDF({ file, suspiciousLinks, stampImagePath }, outputPath){
  console.log('[generateScanPDF] =>', outputPath);
  let browser;
  try {
    console.log('[generateScanPDF] about to launch browser...');
    browser = await launchBrowser();
    console.log('[generateScanPDF] browser launched, new page...');
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
    console.log('[generateScanPDF] rendering HTML =>', html.length, 'chars');
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
    if(browser) {
      console.log('[generateScanPDF] closing browser...');
      await browser.close().catch(()=>{});
    }
  }
}

//--------------------------------------
// [6] Aggregator + fallbackDirect (搜圖): Ginifab / Bing / TinEye / Baidu
//--------------------------------------

/**
 * 嘗試在當前頁面尋找並關閉「廣告/防機器人彈窗」的 XX 按鈕
 * 您需要根據實際網頁廣告結構來修改
 */
async function tryCloseAd(page) {
  try {
    // 範例: 假設出現一個 class="adCloseBtn" 的 X
    // 或者某個 button 帶 "close" 文字
    const closeBtnSelector = 'button.ad-close, .adCloseBtn, .close';
    
    // 等待 2 秒觀察是否出現
    await page.waitForTimeout(2000);
    const closeBtn = await page.$(closeBtnSelector);
    if(closeBtn){
      console.log('[tryCloseAd] found close button, clicking...');
      await closeBtn.click();
      // 再等一秒看是否真的關掉
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

/**
 * 在 ginifab 頁面嘗試「本機檔案上傳」
 *  (您原有的function，保留不動)
 */
async function tryGinifabUploadLocal(page, localImagePath) {
  try {
    // 可能需要先點擊「上傳本機圖片」或類似的按鈕(視實際 DOM 而定)
    // 以下示範: 用文字篩選 <a>，文字包含「上傳本機圖片」
    const uploadLink = await page.$x("//a[contains(text(),'上傳本機圖片')]");
    if (uploadLink.length) {
      await uploadLink[0].click();
      await page.waitForTimeout(1000);
    }
    
    // 找 input[type=file]
    const fileInput = await page.waitForSelector('input[type=file]', { timeout:5000 });
    // 上傳我們本地的檔案
    await fileInput.uploadFile(localImagePath);

    // 簡單等一下，看 ginifab 是否有完成預覽/結果
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal] upload success =>', localImagePath);
    return true;
  } catch(e) {
    console.warn('[tryGinifabUploadLocal] fail =>', e.message);
    return false;
  }
}

/**
 * 在 ginifab 頁面嘗試「指定圖片網址」
 * (您原本的function，保留不動)
 */
async function tryGinifabWithUrl(page, publicImageUrl) {
  try {
    const closedAd = await tryCloseAd(page);
    if(closedAd) {
      console.log('[tryGinifabWithUrl] closed ad, proceed...');
    }
    await page.waitForTimeout(1000);
    const linkFound = await page.evaluate(()=>{
      const link = [...document.querySelectorAll('a')]
        .find(a => a.innerText.includes('指定圖片網址'));
      if(link) { link.click(); return true; }
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

/**
 * Google 流程 (保留您原本的 gotoGinifabViaGoogle)
 */
async function gotoGinifabViaGoogle(page, publicImageUrl){
  console.log('[gotoGinifabViaGoogle]');
  try {
    await page.goto('https://www.google.com', {
      waitUntil:'domcontentloaded', timeout:20000
    });
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
    await page.waitForTimeout(2000);

    // 再嘗試 URL 版 (此處保留您原邏輯)
    const ok = await tryGinifabWithUrl(page, publicImageUrl);
    return ok;
  } catch(e){
    console.error('[gotoGinifabViaGoogle error]', e);
    return false;
  }
}

/**
 * aggregatorSearchGinifab:
 *  (保留您原本的 aggregatorSearchGinifab，但在「3) 嘗試本機上傳」那邊，
 *   先插入一個「iOS/Android/Desktop 三合一流程」的函式 => tryGinifabUploadLocalAllFlow。
 *   若三合一流程失敗，再回到您原本的 tryGinifabUploadLocal => tryGinifabWithUrl => google fallback)
 */
async function aggregatorSearchGinifab(browser, localImagePath, publicImageUrl) {
  console.log('[aggregatorSearchGinifab] => local=', localImagePath, ' url=', publicImageUrl);
  const ret = {
    bing:   { success:false, links:[] },
    tineye: { success:false, links:[] },
    baidu:  { success:false, links:[] }
  };

  let page;
  try {
    // [1] 先直接打開 ginifab
    page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded', 
      timeout:20000
    });
    await page.waitForTimeout(2000);

    // === 新增：先嘗試 iOS/Android/Desktop 三合一 ===
    let successLocal = await tryGinifabUploadLocalAllFlow(page, localImagePath);
    // 若三合一流程都失敗，才回到您原本的 tryGinifabUploadLocal
    if(!successLocal){
      console.log('[aggregatorSearchGinifab] allFlow fail => fallback old tryGinifabUploadLocal...');
      successLocal = await tryGinifabUploadLocal(page, localImagePath);
    }

    // 如果本機上傳失敗 => 改嘗試「指定圖片網址」
    if(!successLocal) {
      console.log('[aggregatorSearchGinifab] local upload fail => try URL approach...');
      successLocal = await tryGinifabWithUrl(page, publicImageUrl);
    }

    // 若還是不行 => google fallback
    if(!successLocal) {
      console.warn('[aggregatorSearchGinifab] local+URL both fail => goto google fallback...');
      await page.close().catch(()=>{});
      page = null;

      const newPage = await browser.newPage();
      const googleOk = await gotoGinifabViaGoogle(newPage, publicImageUrl);
      if(!googleOk) {
        console.warn('[aggregatorSearchGinifab] google path also fail => give up aggregator');
        await newPage.close().catch(()=>{});
        return ret; // 直接回傳, ret預設都success=false
      } else {
        // 成功進到 ginifab 頁面 => 再試一次
        page = newPage;
        let ok2 = await tryGinifabUploadLocalAllFlow(page, localImagePath);
        if(!ok2){
          console.log('[aggregatorSearchGinifab] allFlow again fail => fallback old tryGinifabUploadLocal...');
          ok2 = await tryGinifabUploadLocal(page, localImagePath);
        }
        if(!ok2){
          console.log('[aggregatorSearchGinifab] local upload (2) fail => try URL approach (2) ...');
          ok2 = await tryGinifabWithUrl(page, publicImageUrl);
        }
        if(!ok2){
          console.warn('[aggregatorSearchGinifab] still fail => aggregator stop');
          await page.close().catch(()=>{});
          return ret;
        }
      }
    }

    // === 若能到此, 代表已成功上傳 => 順序點 Bing / TinEye / Baidu
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
      }
    }

  } catch(e){
    console.error('[aggregatorSearchGinifab fail]', e);
  } finally {
    if(page) await page.close().catch(()=>{});
  }
  return ret;
}

//=== 以下 directSearchBing / directSearchTinEye 不動 ===//
//=== 只在 directSearchBaidu 中加「再次進入 image.baidu.com」示範 ===//
async function directSearchBing(browser, imagePath){
  console.log('[directSearchBing] =>', imagePath);
  const ret={ success:false, links:[] };
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://www.bing.com/images', {
      waitUntil:'domcontentloaded', timeout:20000
    });
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
    await page.goto('https://tineye.com/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
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
    // 原本您只去過 https://graph.baidu.com/，這裡先保留
    await page.goto('https://graph.baidu.com/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await page.waitForTimeout(2000);

    const fInput= await page.$('input[type=file]');
    if(!fInput) throw new Error('Baidu input[type=file] not found');
    await fInput.uploadFile(imagePath);
    await page.waitForTimeout(5000);

    // ★ 新增：再次進入 image.baidu.com => 再點相機 => 再上傳
    try {
      console.log('[directSearchBaidu] second approach => go image.baidu.com');
      await page.goto('https://image.baidu.com/', {
        waitUntil:'domcontentloaded', timeout:20000
      });
      await page.waitForTimeout(2000);
      // 點相機 (class= "soutu-btn")
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

    // 收集連結
    let hrefs= await page.$$eval('a', as=> as.map(a=> a.href));
    hrefs= hrefs.filter(h=> h && !h.includes('baidu.com'));
    ret.links= [...new Set(hrefs)].slice(0,5);
    ret.success= ret.links.length>0;
  } catch(e){
    console.error('[directSearchBaidu] fail =>', e);
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

/** aggregatorFirst 預設為 true => Ginifab，若失敗再 fallbackDirect */
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

    // fallback
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
// [7] POST /protect/step1 => 上傳 & 產生證書
//--------------------------------------
router.post('/step1', upload.single('file'), async(req,res)=>{
  try {
    console.log('[POST /step1] start...');
    if(!req.file){
      return res.status(400).json({ error:'NO_FILE', message:'請上傳檔案' });
    }
    console.log('[step1] file =>', req.file.originalname, req.file.mimetype, req.file.size);

    const { realName, birthDate, phone, address, email, title, agreePolicy }= req.body;
    console.log('[step1] form =>', { realName, birthDate, phone, address, email, title, agreePolicy });

    // 檢查必填
    if(!realName || !birthDate || !phone || !address || !email || !title){
      return res.status(400).json({ error:'MISSING_FIELDS', message:'必填資訊不足' });
    }
    if(agreePolicy!=='true'){
      return res.status(400).json({ error:'POLICY_REQUIRED', message:'請勾選服務條款' });
    }

    const mimeType   = req.file.mimetype;
    const isVideo    = mimeType.startsWith('video');
    const isUnlimited= ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);

    if(isVideo && !isUnlimited){
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ error:'UPGRADE_REQUIRED', message:'短影片需升級付費' });
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
      console.log('[step1] created new user => ID=', user.id);
    }

    // fingerprint
    const buf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(buf);
    console.log('[step1] fingerprint =>', fingerprint);

    // 查重
    const exist= await File.findOne({ where:{ fingerprint }});
    if(exist){
      console.log(`[step1] detected duplicated fingerprint => File ID=${exist.id}`);
      // 預設動作：刪除剛上傳的暫存檔(避免浪費空間)
      const extExist = path.extname(exist.filename) || path.extname(req.file.originalname) || '';
      const finalPathExist = path.join(UPLOAD_BASE_DIR, `imageForSearch_${exist.id}${extExist}`);
      const pdfExistPath   = path.join(CERT_DIR, `certificate_${exist.id}.pdf`);

      if(isUnlimited){
        // 1) 若 local 檔案不存在，才用這次上傳的檔案覆蓋回去
        if(!fs.existsSync(finalPathExist)){
          console.log('[step1] local file is missing => restore from newly uploaded =>', finalPathExist);
          try {
            fs.renameSync(req.file.path, finalPathExist);
          } catch(eRen){
            if(eRen.code==='EXDEV'){
              fs.copyFileSync(req.file.path, finalPathExist);
              fs.unlinkSync(req.file.path);
              console.log('[step1] fallback copyFile =>', finalPathExist);
            } else {
              throw eRen;
            }
          }
        } else {
          fs.unlinkSync(req.file.path);
        }

        // 2) 若 PDF 不存在 => 重新產生
        if(!fs.existsSync(pdfExistPath)){
          console.log(`[step1] PDF not found => re-generate certificate_${exist.id}.pdf`);
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
            console.log('[step1] re-generate PDF done =>', pdfExistPath);
          } catch(ePDF){
            console.error('[step1] re-generate PDF error =>', ePDF);
          }
        }

        return res.json({
          message:'已上傳相同檔案(白名單允許重複)，自動補齊缺失的 PDF / 本地檔。',
          fileId: exist.id,
          pdfUrl:`/api/protect/certificates/${exist.id}`,
          fingerprint: exist.fingerprint,
          ipfsHash: exist.ipfs_hash,
          txHash: exist.tx_hash,
          defaultPassword: null
        });
      } else {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({ error:'FINGERPRINT_DUPLICATE', message:'此檔案已存在' });
      }
    }

    // === 真的不存在 => 新增記錄 & 生成 PDF ===

    console.log('[step1] about to call ipfsService.saveFile...');
    let ipfsHash='';
    try {
      ipfsHash= await ipfsService.saveFile(buf);
      console.log('[step1] IPFS =>', ipfsHash);
    } catch(eIPFS){
      console.error('[step1 IPFS error]', eIPFS);
    }

    console.log('[step1] about to call chain.storeRecord...');
    let txHash='';
    try {
      const rec= await chain.storeRecord(fingerprint, ipfsHash||'');
      txHash= rec?.transactionHash||'';
      console.log('[step1] chain => txHash=', txHash);
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
    console.log('[step1] File record created => ID=', newFile.id);

    if(isVideo) user.uploadVideos=(user.uploadVideos||0)+1;
    else user.uploadImages=(user.uploadImages||0)+1;
    await user.save();

    console.log('[step1] moving local file => /uploads');
    const ext= path.extname(req.file.originalname)||'';
    const finalPath= path.join(UPLOAD_BASE_DIR, `imageForSearch_${newFile.id}${ext}`);
    try {
      fs.renameSync(req.file.path, finalPath);
    } catch(eRen){
      if(eRen.code==='EXDEV'){
        fs.copyFileSync(req.file.path, finalPath);
        fs.unlinkSync(req.file.path);
        console.log('[step1] fallback copyFile =>', finalPath);
      } else {
        throw eRen;
      }
    }

    let previewPath=null;
    if(isVideo){
      try {
        console.log('[step1] checking video duration => ffprobe...');
        const durSec= parseFloat(
          execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalPath}"`)
            .toString().trim()
        )||9999;
        console.log('[step1] video durSec =>', durSec);

        if(durSec<=30){
          const mid= Math.floor(durSec/2);
          const outP= path.join(UPLOAD_BASE_DIR, `preview_${newFile.id}.png`);
          execSync(`ffmpeg -i "${finalPath}" -ss ${mid} -frames:v 1 "${outP}"`);
          if(fs.existsSync(outP)){
            previewPath= outP;
            console.log('[step1] got middle frame =>', outP);
          } else {
            console.warn('[step1] middle frame not found =>', outP);
          }
        } else {
          console.warn('[step1] Video is longer than 30s => no preview frame');
        }
      } catch(eVid){
        console.error('[Video middle frame error]', eVid);
      }
    } else {
      previewPath= finalPath;
    }

    const pdfName= `certificate_${newFile.id}.pdf`;
    const pdfPath= path.join(CERT_DIR, pdfName);
    const stampImg= path.join(__dirname, '../../public/stamp.png');

    console.log('[step1] generating PDF =>', pdfPath);
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
        serial    : user.serialNumber,
        mimeType  : mimeType,
        issueDate : new Date().toLocaleString(),
        filePath  : previewPath,
        stampImagePath: fs.existsSync(stampImg)? stampImg:null
      }, pdfPath);
      console.log('[step1] PDF generation done =>', pdfPath);
    } catch(ePDF){
      console.error('[step1 generateCertificatePDF error]', ePDF);
    }

    const pdfExists= fs.existsSync(pdfPath);
    console.log('[step1] PDF done =>', pdfPath, 'pdfExists?', pdfExists);

    return res.json({
      message : '上傳成功並完成證書PDF',
      fileId  : newFile.id,
      pdfUrl  : `/api/protect/certificates/${newFile.id}`,
      fingerprint, ipfsHash, txHash,
      defaultPassword
    });

  } catch(err){
    console.error('[step1 error]', err);
    return res.status(500).json({ error:'STEP1_ERROR', detail:err.message });
  }
});

//--------------------------------------
// [8] GET /protect/certificates/:fileId => 下載PDF
//--------------------------------------
router.get('/certificates/:fileId', async(req,res)=>{
  try {
    const fileId=req.params.fileId;
    console.log('[GET /certificates] fileId=', fileId);

    const pdfPath  = path.join(CERT_DIR, `certificate_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      console.warn('[GET /certificates] PDF not exist =>', pdfPath);
      return res.status(404).json({ error:'NOT_FOUND', message:'證書PDF不存在' });
    }
    console.log('[GET /certificates] => download =>', pdfPath);

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
    console.log('[GET /scan/:fileId] =>', fileId);

    const fileRec= await File.findByPk(fileId);
    if(!fileRec){
      console.warn('[scan] file not found =>', fileId);
      return res.status(404).json({ error:'FILE_NOT_FOUND', message:'無此File ID' });
    }

    // 1) 多平台文字爬蟲 (示範)
    const query= fileRec.filename || fileRec.fingerprint;
    let suspiciousLinks=[];
    // 例如 TikTok (需 RAPIDAPI_KEY)
    if(process.env.RAPIDAPI_KEY){
      try {
        console.log('[scan] tiktok search =>', query);
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

    // 2) 檔案是否存在
    const ext= path.extname(fileRec.filename)||'';
    const localPath= path.join(UPLOAD_BASE_DIR, `imageForSearch_${fileRec.id}${ext}`);
    if(!fs.existsSync(localPath)){
      console.warn('[scan] localPath not found =>', localPath);
      fileRec.status='scanned';
      fileRec.infringingLinks= JSON.stringify(suspiciousLinks);
      await fileRec.save();
      return res.json({
        message:'原始檔不存在 => 僅文字爬蟲',
        suspiciousLinks
      });
    }

    // 3) aggregator + fallback
    let allLinks=[...suspiciousLinks];
    const isVideo= !!ext.match(/\.(mp4|mov|avi|mkv|webm)$/i);
    console.log('[scan] file =>', fileRec.filename, ' isVideo=', isVideo);

    function getPublicUrl(fileId, extension){
      return `${PUBLIC_HOST}/uploads/imageForSearch_${fileId}${extension}`;
    }

    if(isVideo){
      try {
        console.log('[scan] checking video duration => ffprobe...');
        const durSec= parseFloat(execSync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`
        ).toString().trim())||9999;
        console.log('[scan] video durSec =>', durSec);

        if(durSec<=30){
          // 短影片 -> 分段抽幀
          const frameDir= path.join(UPLOAD_BASE_DIR, `frames_${fileRec.id}`);
          if(!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);
          const frames= await extractKeyFrames(localPath, frameDir, 10,5);
          console.log('[scan] extracted frames =>', frames.length);

          for(const fPath of frames){
            console.log('[scan] aggregator on frame =>', fPath);
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
      console.log('[scan] single image => aggregator+fallback =>', localPath);
      const publicUrl= getPublicUrl(fileId, ext);
      const engineRes= await doSearchEngines(localPath, true, publicUrl);
      allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
    }

    const unique= [...new Set(allLinks)];
    fileRec.status='scanned';
    fileRec.infringingLinks= JSON.stringify(unique);
    await fileRec.save();

    // 4) 產「掃描報告 PDF」
    const scanPdfName= `scanReport_${fileRec.id}.pdf`;
    const scanPdfPath= path.join(REPORTS_DIR, scanPdfName);

    const stampPath= path.join(__dirname, '../../public/stamp.png');
    console.log('[scan] generating PDF =>', scanPdfPath);

    await generateScanPDF({
      file: fileRec,
      suspiciousLinks: unique,
      stampImagePath: fs.existsSync(stampPath)? stampPath:null
    }, scanPdfPath);

    console.log('[scan] done =>', scanPdfPath);
    const rptExists= fs.existsSync(scanPdfPath);
    console.log('[scan] PDF fileExists?', rptExists);

    // ★ 新增：圖搜完成後刪除暫存檔(影片 / 圖片 / 抽幀資料夾)
    try {
      if(isVideo){
        if(fs.existsSync(localPath)){
          fs.unlinkSync(localPath);
          console.log('[scan] removed local video =>', localPath);
        }
        const frameDir= path.join(UPLOAD_BASE_DIR, `frames_${fileRec.id}`);
        if(fs.existsSync(frameDir)){
          fs.rmSync(frameDir, { recursive: true, force: true });
          console.log('[scan] removed frame dir =>', frameDir);
        }
      } else {
        if(fs.existsSync(localPath)){
          fs.unlinkSync(localPath);
          console.log('[scan] removed local image =>', localPath);
        }
      }
    } catch(eDel){
      console.error('[scan] remove ephemeral error =>', eDel);
    }

    return res.json({
      message:'圖搜+文字爬蟲完成 => PDF OK',
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
    console.log('[GET /scanReports] =>', fileId);

    const pdfPath   = path.join(REPORTS_DIR, `scanReport_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      console.warn('[scanReports] not found =>', pdfPath);
      return res.status(404).json({ error:'NOT_FOUND', message:'掃描報告不存在' });
    }
    console.log('[scanReports] => download =>', pdfPath);

    return res.download(pdfPath, `KaiShield_ScanReport_${fileId}.pdf`);
  } catch(e){
    console.error('[scanReports error]', e);
    return res.status(500).json({ error:e.message });
  }
});

// (可選) /protect => DEMO
router.post('/protect', upload.single('file'), async(req,res)=>{
  return res.json({ success:true, message:'(示範) direct protect route' });
});

/* 
  =================================================================
  ★ 以下是新增的函式: iOS/Android/Desktop 三合一 (只增不減)
  =================================================================
*/

/**
 * iOS 模擬流程：上傳本機圖片 -> 選擇檔案 -> 照片圖庫 -> 完成 -> input[type=file]
 * 若 DOM 找不到(throw Error) 就會回傳 false
 */
async function tryGinifabUploadLocal_iOS(page, localImagePath){
  console.log('[tryGinifabUploadLocal_iOS] Start iOS-like flow...');
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
    if(!photoBtn) throw new Error('No "照片圖庫/相簿/Photo Library" link for iOS flow');
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

/**
 * Android 模擬流程：上傳本機圖片 -> 選擇檔案 -> 直接相簿 -> input[type=file]
 */
async function tryGinifabUploadLocal_Android(page, localImagePath){
  console.log('[tryGinifabUploadLocal_Android] Start Android-like flow...');
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

/**
 * Desktop 模擬流程：上傳本機圖片 -> 直接出現 input[type=file] -> upload
 */
async function tryGinifabUploadLocal_Desktop(page, localImagePath){
  console.log('[tryGinifabUploadLocal_Desktop] Start Desktop-like flow...');
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

/**
 * 三合一：先 iOS -> 再 Android -> 再 Desktop。
 *  只要有一種成功就算成功
 */
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

module.exports = router;
