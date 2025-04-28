/*************************************************************
 * express/routes/protect.js (最終整合+更詳盡除錯紀錄)
 *
 * - Step1: 上傳檔案 => fingerprint, IPFS, 區塊鏈 => 產生「原創證書 PDF」
 * - 短影片(≤30秒) => 抽幀 => aggregator(Ginifab) + fallback(Bing/TinEye/Baidu)
 * - 針對 FB/IG/YouTube/TikTok 做文字爬蟲(示例)
 * - PDF 檔名: certificate_{fileId}.pdf / scanReport_{fileId}.pdf
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

// ========== (範例) JWT：若您需要驗證 Token，可打開以下兩行，並在路由中插入 protectAuth (請看最後範例) ==========
// const jwt = require('jsonwebtoken');
// const { protectAuth } = require('./protectAuth');  // 假設您另創一個檔案 express/routes/protectAuth.js

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
// [1] 先建立 /uploads /uploads/certificates /uploads/reports
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
    // 若要中斷流程可 throw e
  }
}
// 開始前執行一次，確保目錄存在
ensureUploadDirs();

// Multer: 上限 100MB
// (保留你原先的設定: dest='uploads/', 限制檔案大小100MB)
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
// [2] 內嵌字體 (PDF 中文) - 供 Puppeteer 產 PDF 時嵌入
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
// [3] Helpers: 建立 Puppeteer Browser (headless+stealth)
//     可在 Docker/伺服器上透過 CHROMIUM_PATH 指定 chromium 路徑
//----------------------------------------
async function launchBrowser(){
  console.log('[launchBrowser] starting stealth browser...');
  return puppeteer.launch({
    headless:'new',
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

    // ========== 圖片/影片預覽 ==========
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

    // ========== HTML 模板 ==========
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

    // 產 PDF
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
// [5] 產生「侵權偵測報告 PDF」(Puppeteer)
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
    if(browser) await browser.close().catch(()=>{});
  }
}

//--------------------------------------
// [6] Aggregator + fallbackDirect (搜圖) - Ginifab / Bing / TinEye / Baidu
//--------------------------------------
async function aggregatorSearchGinifab(browser, publicImageUrl){
  console.log('[aggregatorSearchGinifab] =>', publicImageUrl);
  const ret = {
    bing:{ success:false, links:[] },
    tineye:{ success:false, links:[] },
    baidu:{ success:false, links:[] }
  };
  let page;
  try {
    page = await browser.newPage();
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await page.waitForTimeout(1500);

    // 點擊「指定圖片網址」
    await page.evaluate(()=>{
      const a= [...document.querySelectorAll('a')]
        .find(x=> x.innerText.includes('指定圖片網址'));
      if(a) a.click();
    });
    await page.waitForSelector('input[type=text]', { timeout:8000 });
    await page.type('input[type=text]', publicImageUrl, { delay:50 });
    await page.waitForTimeout(500);

    // 順序點擊 Bing / TinEye / Baidu
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
      page.waitForFileChooser({ timeout:6000 }),
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
    await page.goto('https://graph.baidu.com/', {
      waitUntil:'domcontentloaded', timeout:20000
    });
    await page.waitForTimeout(2000);

    const fInput= await page.$('input[type=file]');
    if(!fInput) throw new Error('Baidu input[type=file] not found');
    await fInput.uploadFile(imagePath);
    await page.waitForTimeout(5000);

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
    const [rBing, rTine, rBai] = await Promise.all([
      directSearchBing(browser, imagePath),
      directSearchTinEye(browser, imagePath),
      directSearchBaidu(browser, imagePath)
    ]);
    final.bing= rBing.links;
    final.tineye= rTine.links;
    final.baidu= rBai.links;
  } catch(e){
    console.error('[fallbackDirectEngines error]', e);
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
  return final;
}

async function doSearchEngines(localFilePath, aggregatorFirst=false, aggregatorImageUrl=''){
  console.log('[doSearchEngines] aggregatorFirst=', aggregatorFirst, ' aggregatorUrl=', aggregatorImageUrl);
  const ret = { bing:{}, tineye:{}, baidu:{} };
  let aggregatorOk=false;

  if(aggregatorFirst && aggregatorImageUrl){
    let browser;
    try {
      browser = await launchBrowser();
      const aggRes = await aggregatorSearchGinifab(browser, aggregatorImageUrl);
      const total = aggRes.bing.links.length + aggRes.tineye.links.length + aggRes.baidu.links.length;
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
      // 若要改成「非白名單者允許 30 秒內上傳」，可參考 partial snippet 做 ffprobe
      // 但目前你的邏輯是「非白名單者 => 402 錯誤」直接阻擋
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
      fs.unlinkSync(req.file.path);
      if(isUnlimited){
        return res.json({
          message:'已上傳相同檔案(白名單允許重複)',
          fileId: exist.id,
          pdfUrl:`/api/protect/certificates/${exist.id}`,
          fingerprint: exist.fingerprint,
          ipfsHash: exist.ipfs_hash,
          txHash: exist.tx_hash,
          defaultPassword:null
        });
      } else {
        return res.status(409).json({ error:'FINGERPRINT_DUPLICATE', message:'此檔案已存在' });
      }
    }

    // =========== IPFS ============
    console.log('[step1] about to call ipfsService.saveFile...');
    let ipfsHash='';
    try {
      ipfsHash= await ipfsService.saveFile(buf);
      console.log('[step1] IPFS =>', ipfsHash);
    } catch(eIPFS){
      console.error('[step1 IPFS error]', eIPFS);
    }

    // =========== Chain ============
    console.log('[step1] about to call chain.storeRecord...');
    let txHash='';
    try {
      const rec= await chain.storeRecord(fingerprint, ipfsHash||'');
      txHash= rec?.transactionHash||'';
      console.log('[step1] chain => txHash=', txHash);
    } catch(eChain){
      console.error('[step1 chain error]', eChain);
    }

    // 建立 DB 記錄
    const newFile= await File.create({
      user_id : user.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash : txHash,
      status  :'pending'
    });
    console.log('[step1] File record created => ID=', newFile.id);

    // 統計上傳次數
    if(isVideo) user.uploadVideos=(user.uploadVideos||0)+1;
    else user.uploadImages=(user.uploadImages||0)+1;
    await user.save();

    // 移動原始上傳檔 => uploads 目錄
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

    // 若短影片 => 抽一張中間幀(限 ≤ 30 秒)
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
          console.warn('[step1] Video is longer than 30s => 無法抽預覽幀');
        }
      } catch(eVid){
        console.error('[Video middle frame error]', eVid);
      }
    } else {
      previewPath= finalPath; // 圖片直接預覽
    }

    // ========== 產生「證書 PDF」 => uploads/certificates/ ==========
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
    } catch(ePDF){
      console.error('[step1 generateCertificatePDF error]', ePDF);
    }

    const pdfExists= fs.existsSync(pdfPath);
    console.log('[step1] PDF done =>', pdfPath, 'pdfExists?', pdfExists);

    return res.json({
      message : '上傳成功並完成證書PDF',
      fileId  : newFile.id,
      pdfUrl  : `/api/protect/certificates/${newFile.id}`, // GET 路由
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

    // 讀取 uploads/certificates/ 內 PDF
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
    // FB / IG / YT => placeholder ...
    // suspiciousLinks.push('...');

    // 2) 檢查檔案是否存在
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
    if(isVideo){
      try {
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
            const engineRes= await doSearchEngines(fPath, true, '');
            allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
          }
        }
      } catch(eVid){
        console.error('[scan video aggregator error]', eVid);
      }
    } else {
      console.log('[scan] single image => aggregator+fallback =>', localPath);
      const engineRes= await doSearchEngines(localPath, true, '');
      allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
    }

    const unique= [...new Set(allLinks)];
    fileRec.status='scanned';
    fileRec.infringingLinks= JSON.stringify(unique);
    await fileRec.save();

    // 4) 產「掃描報告 PDF」=> 放 uploads/reports/
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

module.exports = router;

/* ----------------------------------------------------------------------------
   (選擇性) 若您需要 JWT 驗證，可另外新增檔案 express/routes/protectAuth.js
   內容示例：

   const jwt = require('jsonwebtoken');

   exports.protectAuth = (req, res, next) => {
     const authHeader = req.headers.authorization || '';
     const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
     if (!token) {
       return res.status(401).json({ message: '未提供授權令牌' });
     }
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
     } catch (err) {
       console.error('JWT 驗證失敗:', err);
       return res.status(401).json({ message: '無效或過期的授權令牌' });
     }
   };

   使用時只要：
     const { protectAuth } = require('./protectAuth');
   並在任何路由中改為 router.get('/scan/:fileId', protectAuth, async(req,res)=>{...});
---------------------------------------------------------------------------- */
