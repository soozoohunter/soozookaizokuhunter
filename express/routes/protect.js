/*************************************************************
 * express/routes/protect.js (最終整合+除錯增強版)
 *
 * - Step1: 上傳檔案 => fingerprint, IPFS, 區塊鏈 => 產生「原創證書 PDF」
 * - 短影片(≤30秒) => 抽幀 => Aggregator(Ginifab) + fallback(Bing/TinEye/Baidu)
 * - 四大平台爬蟲 (FB/IG/YouTube/TikTok) => 文字搜尋 (示範)
 * - 出錯時可截圖，存到 uploads/err_shots
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
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');

// ffmpeg: 抽影格
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
if(ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
const { extractKeyFrames } = require('../utils/extractFrames');

// Puppeteer + Stealth
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Multer: 上限 100MB
const upload = multer({
  dest: 'uploads/',
  limits:{ fileSize: 100 * 1024 * 1024 }
});

// 白名單 => 可免費上傳短影片
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

// ========== 內嵌字體 (PDF 中文) ==========
let base64TTF='';
try {
  const fontBuf = fs.readFileSync(path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf'));
  base64TTF = fontBuf.toString('base64');
  console.log('[Font] Loaded NotoSansTC-VariableFont_wght.ttf as base64');
} catch(eFont){
  console.error('[Font] Loading error =>', eFont);
}

//----------------------------------------
// Helpers: 建立 Puppeteer Browser + 錯誤截圖
//----------------------------------------
async function launchBrowser(){
  console.log('[launchBrowser] starting stealth browser...');
  return puppeteer.launch({
    headless:'new',
    args:[
      '--no-sandbox','--disable-setuid-sandbox',
      '--disable-gpu','--disable-dev-shm-usage',
      '--disable-web-security','--disable-features=IsolateOrigins',
      '--disable-blink-features=AutomationControlled'
    ],
    defaultViewport:{ width:1280, height:800 }
  });
}

async function saveErrorShot(page, prefix='unknown'){
  const errDir = path.join(__dirname, '../../uploads/err_shots');
  if(!fs.existsSync(errDir)) fs.mkdirSync(errDir, {recursive:true});
  const shotPath = path.join(errDir, `${prefix}_${Date.now()}.png`);
  try {
    await page.screenshot({ path:shotPath, fullPage:true });
    console.log(`[saveErrorShot] => ${shotPath}`);
  } catch(e){
    console.error('[saveErrorShot fail]', e);
  }
}

//----------------------------------------
// 產生「原創證書 PDF」(Puppeteer)
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
    const embeddedFont = base64TTF ? `
      @font-face {
        font-family: "NotoSansTCVar";
        src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
      }
    ` : '';

    // 預覽
    let previewTag='';
    if(filePath && fs.existsSync(filePath) && mimeType.startsWith('image')){
      const ext= path.extname(filePath).replace('.','');
      const b64= fs.readFileSync(filePath).toString('base64');
      previewTag= `<img src="data:image/${ext};base64,${b64}" style="max-width:300px; margin:10px auto; display:block;" />`;
    } else if(mimeType.startsWith('video')){
      previewTag= `<p style="color:gray;">(短影片檔案示意，不顯示畫面)</p>`;
    }

    const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
      ? `<img src="file://${stampImagePath}" style="position:absolute; top:30px; left:30px; width:100px; opacity:0.3; transform:rotate(45deg);" alt="stamp" />`
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
      }
      h1 { text-align:center; }
      .stamp {}
      .field { margin:4px 0; }
      .footer { text-align:center; margin-top:20px; color:#666; font-size:12px; }
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

//----------------------------------------
// 產生「侵權偵測報告 PDF」(Puppeteer)
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
      ? `<img src="file://${stampImagePath}" style="position:absolute; top:30px; right:30px; width:80px; opacity:0.3; transform:rotate(45deg);" alt="stamp" />`
      : '';

    let linksHtml='';
    if(suspiciousLinks && suspiciousLinks.length>0){
      suspiciousLinks.forEach((l,i)=>{
        linksHtml += `<div>${i+1}. ${l}</div>`;
      });
    } else {
      linksHtml = '<p>未發現可疑鏈結</p>';
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
        }
        .stamp {}
        h1 { text-align:center; }
        .footer { margin-top:20px; text-align:center; color:#666; font-size:12px; }
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
      <h3>可疑連結 (含FB/IG/YouTube/TikTok/搜圖等)：</h3>
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

//----------------------------------------
// Aggregator: Ginifab (可擴充) + fallbackDirect (Bing/TinEye/Baidu)
//----------------------------------------
async function aggregatorSearchGinifab(browser, publicImageUrl){
  /**
   * 1) 前往 Ginifab aggregator
   * 2) 輸入 publicImageUrl
   * 3) 順序點擊 [Bing][TinEye][Baidu]
   * 4) 擷取外部連結
   *
   * 備註：若需要上傳本地檔, Ginifab 亦可支援, 但此示例採「公開 URL」
   */
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
      const a= [...document.querySelectorAll('a')].find(x=> x.innerText.includes('指定圖片網址'));
      if(a) a.click();
    });
    await page.waitForSelector('input[type=text]', { timeout:5000 });
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
        // 找對應 a
        await page.evaluate((labels)=>{
          const as= [...document.querySelectorAll('a')];
          for(const lab of labels){
            const found= as.find(x=> x.innerText.includes(lab));
            if(found){ found.click(); return; }
          }
        }, eng.label);

        const popup= await newTab;
        await popup.waitForTimeout(3000);

        let hrefs= await popup.$$eval('a', as=> as.map(a=>a.href));
        // 過濾 aggregator 自身或 engine 自身
        hrefs= hrefs.filter(h=> h && !h.includes('ginifab') &&
          !h.includes('bing.com') && !h.includes('baidu.com') && !h.includes('tineye.com'));
        ret[eng.key].links= hrefs.slice(0,5);
        ret[eng.key].success= ret[eng.key].links.length>0;
        await popup.close();
      } catch(eSub){
        console.error(`[Ginifab aggregator sub-engine fail => ${eng.key}]`, eSub);
      }
    }
  } catch(e){
    console.error('[aggregatorSearchGinifab] fail =>', e);
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
    await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);

    // 嘗試 .camera 或 #sb_sbi
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser({ timeout:6000 }),
      page.click('#sb_sbi').catch(()=>{})
    ]);
    await fileChooser.accept([imagePath]);

    await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
    await page.waitForTimeout(3000);

    // 擷取外部連結
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
    await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(1500);

    // 上傳 input[type=file]
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/112');
    await page.goto('https://graph.baidu.com/', { waitUntil:'domcontentloaded', timeout:20000 });
    await page.waitForTimeout(2000);

    // 上傳 input[type=file]
    const fInput= await page.$('input[type=file]');
    if(!fInput) throw new Error('Baidu input[type=file] not found');
    await fInput.uploadFile(imagePath);
    await page.waitForTimeout(5000);

    let hrefs= await page.$$eval('a', as=> as.map(a=>a.href));
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

/** fallbackDirectEngines => 同時 Bing/TinEye/Baidu */
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

/**
 * doSearchEngines
 * aggregatorFirst => 先 aggregator => 若失敗 => fallbackDirect
 * aggregatorFirst=false => 直接 fallbackDirect
 * aggregator 需要公開 URL => 這裡示範 aggregatorImageUrl
 */
async function doSearchEngines(localFilePath, aggregatorFirst=false, aggregatorImageUrl=''){
  console.log('[doSearchEngines] aggregatorFirst=', aggregatorFirst,' aggregatorUrl=', aggregatorImageUrl);
  const ret = { bing:{}, tineye:{}, baidu:{} };
  let aggregatorOk=false;

  if(aggregatorFirst && aggregatorImageUrl) {
    let browser;
    try {
      browser = await launchBrowser();
      const aggRes = await aggregatorSearchGinifab(browser, aggregatorImageUrl);
      // 檢查 aggregator 是否至少有一個成功
      const countAll = aggRes.bing.links.length + aggRes.tineye.links.length + aggRes.baidu.links.length;
      if(countAll>0) {
        aggregatorOk = true;
        ret.bing = { links: aggRes.bing.links, success:true };
        ret.tineye = { links: aggRes.tineye.links, success:true };
        ret.baidu = { links: aggRes.baidu.links, success:true };
      }
    } catch(eAg){
      console.error('[aggregatorSearchGinifab error]', eAg);
    } finally {
      if(browser) await browser.close().catch(()=>{});
    }

    // fallback if aggregator fail
    if(!aggregatorOk){
      console.log('[doSearchEngines] aggregator fail => fallbackDirect');
      const fb = await fallbackDirectEngines(localFilePath);
      ret.bing = { links: fb.bing, success: fb.bing.length>0 };
      ret.tineye = { links: fb.tineye, success: fb.tineye.length>0 };
      ret.baidu = { links: fb.baidu, success: fb.baidu.length>0 };
    }
  } else {
    // 直接 fallback
    const fb = await fallbackDirectEngines(localFilePath);
    ret.bing = { links: fb.bing, success: fb.bing.length>0 };
    ret.tineye = { links: fb.tineye, success: fb.tineye.length>0 };
    ret.baidu = { links: fb.baidu, success: fb.baidu.length>0 };
  }
  return ret;
}

//--------------------------------------
// Step1: 上傳檔 => Fingerprint => IPFS => Chain => 證書PDF
//--------------------------------------
router.post('/step1', upload.single('file'), async(req,res)=>{
  try {
    console.log('[POST /protect/step1] => Start...');
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

    // 白名單檢查
    const isVideo = req.file.mimetype.startsWith('video');
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);
    if(isVideo && !isUnlimited){
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ error:'UPGRADE_REQUIRED', message:'短影片需付費方案' });
    }

    // 找或建 user
    let user = await User.findOne({ where: { [Op.or]:[{phone},{email}] }});
    let defaultPassword=null;
    if(!user){
      const rawPass = phone+'@KaiShield';
      const hashed = await bcrypt.hash(rawPass,10);
      user = await User.create({
        username:phone, email, phone,
        password:hashed,
        realName, birthDate, address,
        serialNumber:'SN-'+Date.now(),
        role:'user',
        plan:'free'
      });
      defaultPassword=rawPass;
    }

    // fingerprint
    const buf= fs.readFileSync(req.file.path);
    const fingerprint= fingerprintService.sha256(buf);

    // 查重
    const oldFile= await File.findOne({ where:{ fingerprint }});
    if(oldFile){
      fs.unlinkSync(req.file.path);
      if(isUnlimited){
        // 白名單允許重複
        return res.json({
          message:'重複檔案(白名單允許)，回傳舊紀錄',
          fileId: oldFile.id,
          pdfUrl:`/api/protect/certificates/${oldFile.id}`,
          fingerprint:oldFile.fingerprint,
          ipfsHash:oldFile.ipfs_hash,
          txHash:oldFile.tx_hash,
          defaultPassword:null
        });
      } else {
        return res.status(409).json({ error:'FINGERPRINT_DUPLICATE', message:'相同檔案已存在' });
      }
    }

    // IPFS / 區塊鏈
    let ipfsHash='', txHash='';
    try {
      ipfsHash = await ipfsService.saveFile(buf);
      console.log('[step1] IPFS =>', ipfsHash);
    } catch(eIPFS){ console.error('[IPFS error]', eIPFS); }
    try {
      const rec= await chain.storeRecord(fingerprint, ipfsHash||'');
      txHash= rec?.transactionHash||'';
      console.log('[step1] chain => txHash=', txHash);
    } catch(eChain){ console.error('[chain error]', eChain); }

    // 建 File
    const newFile= await File.create({
      user_id: user.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash,
      status: 'pending'
    });
    // 更新 user 計數
    if(isVideo) user.uploadVideos=(user.uploadVideos||0)+1;
    else user.uploadImages=(user.uploadImages||0)+1;
    await user.save();

    // 移動到 /uploads
    const localDir= path.resolve(__dirname,'../../uploads');
    if(!fs.existsSync(localDir)) fs.mkdirSync(localDir,{ recursive:true });
    const ext= path.extname(req.file.originalname)||'';
    const finalPath= path.join(localDir, `imageForSearch_${newFile.id}${ext}`);
    try {
      fs.renameSync(req.file.path, finalPath);
    } catch(eRen){
      if(eRen.code==='EXDEV'){
        fs.copyFileSync(req.file.path, finalPath);
        fs.unlinkSync(req.file.path);
      } else throw eRen;
    }

    // 短影片 => 取中幀
    let previewPath=null;
    if(isVideo){
      try {
        const cmd=`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalPath}"`;
        const durSec= parseFloat(execSync(cmd).toString().trim())||9999;
        if(durSec<=30){
          const mid= Math.floor(durSec/2);
          const outP= path.join(localDir, `preview_${newFile.id}.png`);
          execSync(`ffmpeg -i "${finalPath}" -ss ${mid} -frames:v 1 "${outP}"`);
          if(fs.existsSync(outP)) previewPath= outP;
        }
      } catch(eVid){
        console.error('[video preview error]', eVid);
      }
    } else {
      previewPath= finalPath;
    }

    // 產生「原創證書 PDF」
    const pdfName= `certificate_${newFile.id}.pdf`;
    const pdfPath= path.join(localDir, pdfName);
    const stampP= path.join(__dirname,'../../public/stamp.png');
    await generateCertificatePDF({
      name:user.realName,
      dob:user.birthDate,
      phone:user.phone,
      address:user.address,
      email:user.email,
      title,
      fileName:req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash,
      serial:user.serialNumber,
      mimeType: req.file.mimetype,
      issueDate: new Date().toLocaleString(),
      filePath: previewPath,
      stampImagePath: fs.existsSync(stampP)? stampP:null
    }, pdfPath);

    return res.json({
      message:'上傳成功 & 證書已生成',
      fileId: newFile.id,
      pdfUrl:`/api/protect/certificates/${newFile.id}`,
      fingerprint, ipfsHash, txHash,
      defaultPassword
    });

  } catch(err){
    console.error('[POST /step1 error]', err);
    return res.status(500).json({ error:'STEP1_ERROR', detail:err.message });
  }
});

//--------------------------------------
// GET /protect/certificates/:fileId => 下載PDF
//--------------------------------------
router.get('/certificates/:fileId', async(req,res)=>{
  try {
    const fileId= req.params.fileId;
    const localDir= path.resolve(__dirname, '../../uploads');
    const pdfPath= path.join(localDir, `certificate_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ error:'NOT_FOUND', message:'證書PDF不存在' });
    }
    return res.download(pdfPath, `KaiShield_Certificate_${fileId}.pdf`);
  } catch(e){
    console.error('[certificates error]', e);
    return res.status(500).json({ error:e.message });
  }
});

//--------------------------------------
// GET /protect/scan/:fileId => 侵權掃描
//--------------------------------------
router.get('/scan/:fileId', async(req,res)=>{
  try {
    const fileId= req.params.fileId;
    const fileRec= await File.findByPk(fileId);
    if(!fileRec){
      return res.status(404).json({ error:'FILE_NOT_FOUND', message:'無此檔案' });
    }

    //=== 1) 多平台文字爬蟲 (TikTok/FB/IG/YouTube) - 範例 ===
    const query = fileRec.filename || fileRec.fingerprint;
    let suspiciousLinks=[];
    try {
      // TikTok (RapidAPI)
      if(process.env.RAPIDAPI_KEY){
        try {
          const rTT= await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search',{
            params:{ keywords: query, region:'us', count:'3' },
            headers:{ 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY },
            timeout:10000
          });
          const tItems = rTT.data?.videos||[];
          tItems.forEach(v=>{ if(v.link) suspiciousLinks.push(v.link); });
        } catch(eTik){
          console.error('[scan Tiktok error]', eTik);
        }
      }
      // FB / IG / YT => 以下示範「假設API」，實際商業用途請依官方API or 自訂爬蟲
      // FB => placeholder
      try {
        // e.g. const fbLinks = ...
        // suspiciousLinks.push(...fbLinks);
      } catch(eFB){
        console.error('[scan FB error]', eFB);
      }
      // IG => placeholder
      try {
        // e.g. const igLinks = ...
        // suspiciousLinks.push(...igLinks);
      } catch(eIG){
        console.error('[scan IG error]', eIG);
      }
      // YT => placeholder
      try {
        // e.g. const ytLinks = ...
        // suspiciousLinks.push(...ytLinks);
      } catch(eYT){
        console.error('[scan YT error]', eYT);
      }
    } catch(eAll){
      console.error('[scan multiPlatform error]', eAll);
    }

    //=== 2) 檢查檔案是否存在
    const localDir= path.resolve(__dirname, '../../uploads');
    const ext= path.extname(fileRec.filename)||'';
    const localPath= path.join(localDir, `imageForSearch_${fileRec.id}${ext}`);
    if(!fs.existsSync(localPath)){
      fileRec.status='scanned';
      fileRec.infringingLinks= JSON.stringify(suspiciousLinks);
      await fileRec.save();
      return res.json({
        message:'原始檔不存在 => 只完成(文字)爬蟲',
        suspiciousLinks
      });
    }

    //=== 3) aggregator + fallback => 針對短影片抽幀 / 單圖
    let allLinks= [...suspiciousLinks];
    const isVideo= !!ext.match(/\.(mp4|mov|avi|mkv|webm)$/i);
    if(isVideo){
      // 短影片 => 抽幀 => aggregator + fallback
      try {
        const durSec= parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`).toString().trim())||9999;
        if(durSec<=30){
          const framesDir= path.join(localDir, `frames_${fileRec.id}`);
          if(!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);
          const frames= await extractKeyFrames(localPath, framesDir, 10,5);
          for(const framePath of frames){
            const engineRes= await doSearchEngines(framePath, true, ''); // aggregatorFirst=true, aggregatorImageUrl=''
            allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
          }
        }
      } catch(eVid){
        console.error('[scan shortVideo aggregator error]', eVid);
      }
    } else {
      // 單圖 aggregator
      const engineRes= await doSearchEngines(localPath, true, '');
      allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
    }

    const unique= [...new Set(allLinks)];
    fileRec.status='scanned';
    fileRec.infringingLinks= JSON.stringify(unique);
    await fileRec.save();

    //=== 4) 產「掃描報告 PDF」
    const pdfName= `scanReport_${fileRec.id}.pdf`;
    const pdfPath= path.join(localDir, pdfName);
    const stampPath= path.join(__dirname, '../../public/stamp.png');
    await generateScanPDF({
      file: fileRec,
      suspiciousLinks:unique,
      stampImagePath: fs.existsSync(stampPath)? stampPath:null
    }, pdfPath);

    return res.json({
      message:'圖搜+多平台文字爬蟲完成 => 報告PDF生成',
      suspiciousLinks: unique,
      scanReportUrl: `/api/protect/scanReports/${fileRec.id}`
    });

  } catch(err){
    console.error('[GET /scan/:fileId error]', err);
    return res.status(500).json({ error:'SCAN_ERROR', detail:err.message });
  }
});

//--------------------------------------
// GET /protect/scanReports/:fileId => 下載「侵權偵測報告 PDF」
//--------------------------------------
router.get('/scanReports/:fileId', async(req,res)=>{
  try {
    const fileId= req.params.fileId;
    const localDir= path.resolve(__dirname,'../../uploads');
    const pdfPath= path.join(localDir, `scanReport_${fileId}.pdf`);
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
// (可選) POST /protect => Demo
//--------------------------------------
router.post('/protect', upload.single('file'), async(req,res)=>{
  return res.json({ success:true, message:'(示範) /protect route' });
});

module.exports = router;
