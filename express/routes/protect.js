/*************************************************************
 * express/routes/protect.js
 *
 * - Puppeteer 新 headless 模式 + 內嵌 Base64 字型，避免 Docker 無字型時 PDF 出現亂碼
 * - Ginifab Aggregator + fallback to Direct Engines (Bing/TinEye/Baidu)
 * - TikTok 文字爬蟲
 * - 影片抽幀 (上傳時 / 掃描時)
 * - 產出 PDF（著作證書 + 侵權掃描報告）
 * - PDF 中顯示 SiriNumber 欄位 + 旋轉 45° 圓形 stamp.png + © 2025 聲明
 * - 修正 EXDEV rename (copy+unlink)
 * - 白名單機制 (ALLOW_UNLIMITED)
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

const { User, File } = require('../models');

// 指紋、IPFS、鏈上等服務 (自行實作)
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');

// 影片/抽影格
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
if(ffmpegPath){
  ffmpeg.setFfmpegPath(ffmpegPath);
}
const { extractKeyFrames } = require('../utils/extractFrames');

// Multer (100MB限制)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }
});

// 白名單
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

// =========== Puppeteer + PDF 產生相關 ===========

const puppeteer = require('puppeteer');

// 內嵌 Base64 字型 (避免 Docker 亂碼)
let base64TTF = '';
try {
  // 若您有自己的字型，也可替換檔名
  const fontBuf = fs.readFileSync(path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf'));
  base64TTF = fontBuf.toString('base64');
  console.log('[Font] Loaded NotoSansTC-VariableFont_wght.ttf as base64');
} catch(eFont) {
  console.error('[Font] Loading error =>', eFont);
}

/**
 * 建立一個 Puppeteer 瀏覽器
 */
async function launchBrowser() {
  return await puppeteer.launch({
    headless: 'new', // puppeteer v19+ 支援 'new'，以減少被偵測
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-blink-features=AutomationControlled'
    ],
    defaultViewport: {
      width: 1280,
      height: 800
    }
  });
}

/**
 * 產生「著作證明書」PDF (Certificate)
 * - 圓形 stamp.png (旋轉 45°)
 * - SiriNumber 欄位
 * - 內嵌字型 (base64TTF)
 */
async function generateCertificatePDF(data, outputPath) {
  const {
    name, dob, phone, address, email,
    title, fileName, fingerprint, ipfsHash, txHash,
    serial, mimeType, issueDate, filePath, stampImagePath
  } = data;

  // 自訂 SiriNumber
  const siriNumber = 'Siri-2025-00088';

  // 若是圖片 => 讀檔 base64
  let previewImgTag = '';
  if (mimeType && mimeType.startsWith('image') && filePath && fs.existsSync(filePath)) {
    const ext = path.extname(filePath).slice(1);
    const imgData = fs.readFileSync(filePath).toString('base64');
    previewImgTag = `
      <img src="data:image/${ext};base64,${imgData}" 
           style="max-width:50%; margin:20px auto; display:block;" 
           alt="Preview Image" />
    `;
  } else if (mimeType && mimeType.startsWith('video') && filePath && fs.existsSync(filePath)) {
    // 影片 => 抽一幀
    const thumbDir = path.join(__dirname, '../../uploads/tmp');
    if(!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive:true });
    const thumbPath = path.join(thumbDir, `thumb_${serial}.png`);
    try {
      await new Promise((resolve, reject)=>{
        ffmpeg(filePath)
          .on('end', resolve)
          .on('error', reject)
          .screenshots({
            timestamps: ['50%'],
            filename: `thumb_${serial}.png`,
            folder: thumbDir
          });
      });
      if(fs.existsSync(thumbPath)){
        const base64Vid = fs.readFileSync(thumbPath).toString('base64');
        previewImgTag = `
          <img src="data:image/png;base64,${base64Vid}" 
               style="max-width:50%; margin:20px auto; display:block;" 
               alt="Video Preview" />
        `;
      }
    } catch(eVid){
      console.error('[Video preview error]', eVid);
    }
  }

  const embeddedFontCSS = base64TTF
    ? `@font-face {
        font-family: "NotoSansTCVar";
        src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
      }`
    : `@font-face {
        font-family: "NotoSansTCVar", sans-serif;
      }`;

  const htmlContent = `
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${embeddedFontCSS}
        body {
          font-family: "NotoSansTCVar", sans-serif;
          margin: 0;
          padding: 0;
        }
        .certificate-container {
          position: relative;
          width: 80%;
          margin: 0 auto;
          text-align: center;
          padding: 40px 0;
        }
        .certificate-title {
          font-size: 24px; font-weight: bold;
          margin-bottom: 20px; padding-bottom: 5px;
          border-bottom: 2px solid #000;
        }
        .stamp {
          position: absolute; top: 0; left: 0;
          width: 100px; opacity: 0.9;
          transform: rotate(45deg);
          border-radius: 50%;
        }
        .field {
          font-size: 14px;
          margin: 6px 0;
        }
        .field-label {
          font-weight: bold;
        }
        .footer-company {
          margin-top:30px;
          font-size:12px;
          color:#666;
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        ${
          stampImagePath && fs.existsSync(stampImagePath)
            ? `<img src="file://${stampImagePath}" class="stamp" alt="Stamp">`
            : ''
        }
        <div class="certificate-title">
          原創著作證明書 / Certificate of Copyright
        </div>

        <div class="field">
          <span class="field-label">真實姓名:</span> ${name}
        </div>
        <div class="field">
          <span class="field-label">生日:</span> ${dob||''}
        </div>
        <div class="field">
          <span class="field-label">手機:</span> ${phone}
        </div>
        <div class="field">
          <span class="field-label">地址:</span> ${address||''}
        </div>
        <div class="field">
          <span class="field-label">Email:</span> ${email}
        </div>
        <div class="field">
          <span class="field-label">作品標題:</span> ${title}
        </div>
        <div class="field">
          <span class="field-label">檔名:</span> ${fileName}
        </div>
        <div class="field">
          <span class="field-label">Fingerprint (SHA-256):</span> ${fingerprint}
        </div>
        <div class="field">
          <span class="field-label">IPFS Hash:</span> ${ipfsHash||'N/A'}
        </div>
        <div class="field">
          <span class="field-label">Tx Hash:</span> ${txHash||'N/A'}
        </div>
        <div class="field">
          <span class="field-label">序號 (Serial Number):</span> ${serial}
        </div>
        <div class="field">
          <span class="field-label">SiriNumber:</span> Siri-2025-00088
        </div>
        <div class="field">
          <span class="field-label">檔案型態 (MIME):</span> ${mimeType||''}
        </div>
        <div class="field">
          <span class="field-label">產生日期:</span> ${issueDate||''}
        </div>

        ${previewImgTag}

        <div class="footer-company">
          © 2025 凱盾全球國際股份有限公司 All Rights Reserved.
        </div>
      </div>
    </body>
  </html>
  `;

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil:'networkidle0' });
  await page.emulateMediaType('screen');
  await page.pdf({
    path: outputPath,
    format:'A4',
    printBackground:true
  });
  await browser.close();
}

/**
 * 產生「掃描報告」PDF (Scan Report)
 * - stamp.png (右上角，旋轉45度)
 * - 內嵌字型
 */
async function generateScanPDF({ file, suspiciousLinks, stampImagePath }, outPath) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  const embeddedFontCSS = base64TTF
    ? `@font-face {
        font-family: "NotoSansTCVar";
        src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
      }`
    : `@font-face {
        font-family: "NotoSansTCVar", sans-serif;
      }`;

  const linksHtml = suspiciousLinks.length
    ? suspiciousLinks.map(l=>`<div style="word-wrap:break-word;">${l}</div>`).join('')
    : '未發現任何可疑連結';

  const htmlContent = `
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${embeddedFontCSS}
        body {
          font-family: "NotoSansTCVar", sans-serif;
          margin:0; padding:0;
        }
        .scan-container {
          position: relative;
          width:80%;
          margin:0 auto;
          text-align:center;
          padding:40px 0;
        }
        .stamp {
          position:absolute; width:80px; top:0; right:0;
          opacity:0.9; transform:rotate(45deg);
          border-radius:50%;
        }
        h1 { margin-bottom:20px; }
        .footer-company {
          margin-top:30px; font-size:12px; color:#666;
        }
      </style>
    </head>
    <body>
      <div class="scan-container">
        ${
          stampImagePath && fs.existsSync(stampImagePath)
            ? `<img src="file://${stampImagePath}" class="stamp" alt="Stamp">`
            : ''
        }
        <h1>侵權偵測報告 / Scan Report</h1>
        <p>File ID: ${file.id}</p>
        <p>Filename: ${file.filename}</p>
        <p>Fingerprint: ${file.fingerprint}</p>
        <p>Status: ${file.status}</p>
        <hr/>
        <h3>可疑連結:</h3>
        <div>${linksHtml}</div>
        <div class="footer-company">
          © 2025 凱盾全球國際股份有限公司 All Rights Reserved.
        </div>
      </div>
    </body>
  </html>
  `;

  await page.setContent(htmlContent, { waitUntil:'networkidle0' });
  await page.emulateMediaType('screen');
  await page.pdf({
    path: outPath,
    format:'A4',
    printBackground:true
  });
  await browser.close();
}

//---------------------------------------------------------------------
// step1 => 上傳檔案 => fingerprint => IPFS => 區塊鏈 => 產生證書PDF
//---------------------------------------------------------------------
router.post('/step1', upload.single('file'), async(req, res)=>{
  try {
    if(!req.file){
      return res.status(400).json({ code:'NO_FILE_OR_TOO_BIG', error:'請上傳檔案或檔案過大' });
    }

    const { realName, birthDate, phone, address, email, title, keywords, agreePolicy } = req.body;
    if(!realName || !birthDate || !phone || !address || !email){
      return res.status(400).json({ code:'EMPTY_REQUIRED', error:'缺少必填欄位' });
    }
    if(!title){
      return res.status(400).json({ code:'NO_TITLE', error:'請輸入作品標題' });
    }
    if(agreePolicy!=='true'){
      return res.status(400).json({ code:'POLICY_REQUIRED', error:'請勾選同意隱私權政策與使用條款' });
    }

    const mimeType = req.file.mimetype;
    const isVideo = mimeType.startsWith('video');

    // 白名單 => 可免費上傳短影片
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);
    if(isVideo && !isUnlimited){
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ code:'NEED_PAYMENT', error:'短影音需付費方案' });
    }

    // 建 / 找 user
    let finalUser = await User.findOne({
      where:{ [Op.or]: [{email},{phone}] }
    });
    let defaultPassword=null;
    if(!finalUser){
      const rawPass = phone+'@KaiShield';
      const hashed = await bcrypt.hash(rawPass,10);
      finalUser = await User.create({
        username: phone,
        email, phone,
        password: hashed,
        realName, birthDate, address,
        serialNumber:'SN-'+Date.now(),
        role:'user',
        plan:'free'
      });
      defaultPassword=rawPass;
    }

    // fingerprint
    const fileBuf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(fileBuf);

    // 查重
    const existFile = await File.findOne({ where:{ fingerprint }});
    if(existFile){
      if(isUnlimited){
        fs.unlinkSync(req.file.path);
        return res.json({
          message:'已上傳相同檔案(白名單允許)，回傳舊紀錄',
          fileId: existFile.id,
          pdfUrl:`/api/protect/certificates/${existFile.id}`,
          fingerprint: existFile.fingerprint,
          ipfsHash: existFile.ipfs_hash,
          txHash: existFile.tx_hash,
          defaultPassword:null
        });
      } else {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({
          code:'FINGERPRINT_DUPLICATE',
          error:'此檔案已存在(相同fingerprint)'
        });
      }
    }

    // IPFS / Chain
    let ipfsHash='', txHash='';
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch(eIPFS){
      console.error('[step1 IPFS error]', eIPFS);
    }
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash||'');
      txHash = receipt?.transactionHash || '';
    } catch(eChain){
      console.error('[step1 chain error]', eChain);
    }

    // 建立 File 記錄
    const newFile = await File.create({
      user_id: finalUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash,
      status:'pending'
    });
    if(isVideo) finalUser.uploadVideos = (finalUser.uploadVideos||0)+1;
    else finalUser.uploadImages = (finalUser.uploadImages||0)+1;
    await finalUser.save();

    // 移動 => /uploads
    const localDir = path.resolve(__dirname, '../../uploads');
    if(!fs.existsSync(localDir)) fs.mkdirSync(localDir,{recursive:true});
    const ext = path.extname(req.file.originalname)||'';
    const targetPath = path.join(localDir, `imageForSearch_${newFile.id}${ext}`);

    // EXDEV => copy+unlink
    try {
      fs.renameSync(req.file.path, targetPath);
    } catch(renameErr){
      if(renameErr.code==='EXDEV'){
        fs.copyFileSync(req.file.path, targetPath);
        fs.unlinkSync(req.file.path);
      } else throw renameErr;
    }

    // 短影片(<=30秒) => 抽中幀 => 供產生PDF預覽
    let finalPreviewPath=null;
    if(isVideo){
      try {
        const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${targetPath}"`;
        const durSec = parseFloat(execSync(cmd).toString().trim())||9999;
        if(durSec<=30){
          const mid = Math.floor(durSec/2);
          const tmpFrameDir = path.join(localDir, 'tmpFrames');
          if(!fs.existsSync(tmpFrameDir)) fs.mkdirSync(tmpFrameDir);
          const outP = path.join(tmpFrameDir, `thumb_${newFile.id}.png`);
          execSync(`ffmpeg -i "${targetPath}" -ss ${mid} -frames:v 1 "${outP}"`);
          if(fs.existsSync(outP)){
            finalPreviewPath = outP;
          }
        }
      } catch(eVid){
        console.error('[Video middle frame error]', eVid);
      }
    } else {
      finalPreviewPath=targetPath;
    }

    // 產生證書 PDF
    const pdfFileName = `certificate_${newFile.id}.pdf`;
    const pdfPath = path.join(localDir, pdfFileName);
    const stampPath = path.join(__dirname, '../../public/stamp.png');

    await generateCertificatePDF({
      name: finalUser.realName,
      dob: finalUser.birthDate,
      phone: finalUser.phone,
      address: finalUser.address,
      email: finalUser.email,
      title: title.trim(),
      fileName: req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash,
      serial: finalUser.serialNumber,
      mimeType,
      issueDate: new Date().toLocaleString(),
      filePath: finalPreviewPath || targetPath,
      stampImagePath: fs.existsSync(stampPath) ? stampPath : null
    }, pdfPath);

    return res.json({
      message:'上傳成功並完成證書PDF',
      fileId:newFile.id,
      pdfUrl:`/api/protect/certificates/${newFile.id}`,
      fingerprint, ipfsHash, txHash,
      defaultPassword
    });
  } catch(err){
    console.error('[step1 error]', err);
    if(err.code==='LIMIT_FILE_SIZE'){
      return res.status(413).json({ code:'FILE_TOO_LARGE', error:'檔案超過大小限制' });
    }
    return res.status(500).json({ code:'STEP1_ERROR', error: err.message });
  }
});

// 下載證書 PDF
router.get('/certificates/:fileId', async(req,res)=>{
  try {
    const fileId = req.params.fileId;
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath = path.join(localDir, `certificate_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ code:'NOT_FOUND', error:'證書不存在' });
    }
    res.download(pdfPath, `KaiKaiShield_Certificate_${fileId}.pdf`);
  } catch(err){
    console.error('[certificates error]', err);
    return res.status(500).json({ code:'CERT_DOWNLOAD_ERROR', error: err.message });
  }
});

//---------------------------------------------------------------------
// aggregator: Ginifab => Bing/TinEye/Baidu
//---------------------------------------------------------------------
async function aggregatorSearchGinifab(browser, imageUrl) {
  const results = {
    bing:   { success:false, links:[], screenshot:'' },
    tineye: { success:false, links:[], screenshot:'' },
    baidu:  { success:false, links:[], screenshot:'' }
  };
  for(let attempt=1; attempt<=2; attempt++){
    let page=null;
    try {
      page=await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/112.0.5615.140 Safari/537.36'
      );
      await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
        waitUntil:'domcontentloaded', timeout:20000
      });
      await page.waitForTimeout(2000);

      // 指定圖片網址
      await page.evaluate(()=>{
        const link=[...document.querySelectorAll('a')]
          .find(a=>a.innerText.includes('指定圖片網址'));
        if(link) link.click();
      });
      await page.waitForSelector('input[type=text]', { timeout:8000 });
      await page.type('input[type=text]', imageUrl, { delay:50 });
      await page.waitForTimeout(1000);

      // 順序點擊: "微軟必應"/"錫眼睛"/"百度"
      const engineList = [
        { name:'bing',   label:'微軟必應' },
        { name:'tineye', label:'錫眼睛' },
        { name:'baidu',  label:'百度' },
      ];
      for(const eng of engineList){
        try{
          const newPagePromise = new Promise(resolve=>{
            browser.once('targetcreated', async(target)=>{
              const p=await target.page();
              resolve(p);
            });
          });
          await page.evaluate((label)=>{
            const a=[...document.querySelectorAll('a')]
              .find(x=>x.innerText.includes(label));
            if(a) a.click();
          }, eng.label);

          const popup=await newPagePromise;
          await popup.bringToFront();
          await popup.waitForTimeout(4000);

          // 擷取連結
          let hrefs = await popup.$$eval('a', as=>as.map(a=>a.href));
          hrefs=hrefs.filter(h=>
            h && !h.includes('ginifab.com') &&
            !h.includes('bing.com') &&
            !h.includes('tineye.com') &&
            !h.includes('baidu.com')
          );
          let top5=hrefs.slice(0,5);

          results[eng.name].success= top5.length>0;
          results[eng.name].links= top5;
          results[eng.name].screenshot='';
          await popup.close();
        } catch(subE){
          console.error('[aggregator sub-engine error]', eng.name, subE);
        }
      }
      await page.close();
      break;
    } catch(eAgg){
      console.error('[aggregator ginifab attempt]', attempt, eAgg);
      if(page) await page.close().catch(()=>{});
    }
  }
  return results;
}

//---------------------------------------------------------------------
// direct: Bing / TinEye / Baidu
//---------------------------------------------------------------------
async function directSearchBing(browser, imagePath){
  let ret={ success:false, links:[], screenshot:'' };
  for(let attempt=1; attempt<=2; attempt++){
    let page=null;
    try {
      page=await browser.newPage();
      await page.goto('https://www.bing.com/images',{
        waitUntil:'domcontentloaded', timeout:20000
      });
      await page.waitForTimeout(2000);

      // 相機
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser({ timeout:10000 }),
        page.click('#sb_sbi')
      ]);
      await fileChooser.accept([imagePath]);
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      let links = await page.$$eval('a', as=> as.map(a=>a.href));
      links = links.filter(l=>l&&!l.includes('bing.com')).slice(0,5);
      ret={ success:true, links, screenshot:'' };
      await page.close();
      break;
    } catch(err){
      console.error('[direct Bing attempt]', attempt, err);
      if(page) await page.close();
    }
  }
  return ret;
}
async function directSearchTinEye(browser, imagePath){
  let ret={ success:false, links:[], screenshot:'' };
  for(let attempt=1; attempt<=2; attempt++){
    let page=null;
    try {
      page=await browser.newPage();
      await page.goto('https://tineye.com/',{
        waitUntil:'domcontentloaded', timeout:20000
      });
      const fileInput = await page.waitForSelector('input[type=file]', {timeout:10000});
      await fileInput.uploadFile(imagePath);
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      let links = await page.$$eval('a', as=>as.map(a=>a.href));
      links= links.filter(l=>l&&!l.includes('tineye.com')).slice(0,5);
      ret={ success:true, links, screenshot:'' };
      await page.close();
      break;
    } catch(err){
      console.error('[direct TinEye attempt]', attempt, err);
      if(page) await page.close();
    }
  }
  return ret;
}
async function directSearchBaidu(browser, imagePath){
  let ret={ success:false, links:[], screenshot:'' };
  for(let attempt=1; attempt<=2; attempt++){
    let page=null;
    try {
      page=await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/112.0.5615.140 Safari/537.36'
      );
      await page.goto('https://image.baidu.com/',{
        waitUntil:'domcontentloaded', timeout:20000
      });
      await page.waitForTimeout(2000);
      const cameraBtn = await page.$('span.soutu-btn');
      if(cameraBtn) await cameraBtn.click();
      const fileInput = await page.waitForSelector('input#uploadImg, input[type=file]', {timeout:10000});
      await fileInput.uploadFile(imagePath);
      await page.waitForTimeout(5000);

      let links=await page.$$eval('a', as=>as.map(a=>a.href));
      links=links.filter(l=>l&&!l.includes('baidu.com')).slice(0,5);
      ret={ success:true, links, screenshot:'' };
      await page.close();
      break;
    } catch(err){
      console.error('[direct Baidu attempt]', attempt, err);
      if(page) await page.close();
    }
  }
  return ret;
}

//---------------------------------------------------------------------
// Aggregator + fallback => (bing, tineye, baidu) => combined
//---------------------------------------------------------------------
async function doSearchEngines(localFilePath, aggregatorFirst=false, aggregatorImageUrl='') {
  const browser = await launchBrowser();
  let final={
    bing:{ success:false, links:[] },
    tineye:{ success:false, links:[] },
    baidu:{ success:false, links:[] }
  };
  if(aggregatorFirst && aggregatorImageUrl){
    // 1) aggregator
    const aggregatorRes= await aggregatorSearchGinifab(browser, aggregatorImageUrl);
    final.bing   = aggregatorRes.bing;
    final.tineye = aggregatorRes.tineye;
    final.baidu  = aggregatorRes.baidu;

    // fallback for each
    if(!final.bing.success){
      final.bing = await directSearchBing(browser, localFilePath);
    }
    if(!final.tineye.success){
      final.tineye=await directSearchTinEye(browser, localFilePath);
    }
    if(!final.baidu.success){
      final.baidu=await directSearchBaidu(browser, localFilePath);
    }
    await browser.close();
    return final;
  }

  // 2) direct only
  const rBing   = await directSearchBing(browser, localFilePath);
  const rTinEye = await directSearchTinEye(browser, localFilePath);
  const rBaidu  = await directSearchBaidu(browser, localFilePath);
  final.bing=rBing;
  final.tineye=rTinEye;
  final.baidu=rBaidu;
  await browser.close();
  return final;
}

//---------------------------------------------------------------------
// GET /scan/:fileId => aggregator + fallback => 產出「掃描報告PDF」
//---------------------------------------------------------------------
router.get('/scan/:fileId', async(req, res)=>{
  try {
    const fileId=req.params.fileId;
    const file=await File.findByPk(fileId);
    if(!file){
      return res.status(404).json({ code:'FILE_NOT_FOUND', error:'無此File ID' });
    }

    // 1) TikTok
    let suspiciousLinks=[];
    if(process.env.RAPIDAPI_KEY){
      try {
        const query= file.filename||file.fingerprint;
        const rTT=await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search',{
          params:{ keywords: query, region:'us', count:'5' },
          headers:{
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host':'tiktok-scraper7.p.rapidapi.com'
          },
          timeout:20000
        });
        const tiktokVideos= rTT.data?.videos||[];
        tiktokVideos.forEach(v=>{ if(v.link) suspiciousLinks.push(v.link); });
      } catch(eTT){
        console.error('[TikTok crawler error]', eTT);
      }
    }

    // 2) aggregator + fallback
    const localDir= path.resolve(__dirname, '../../uploads');
    const ext= path.extname(file.filename)||'';
    const localPath= path.join(localDir, `imageForSearch_${file.id}${ext}`);
    if(!fs.existsSync(localPath)){
      file.status='scanned';
      file.infringingLinks= JSON.stringify(suspiciousLinks);
      await file.save();
      return res.json({
        message:'原始檔不存在 => 只完成文字爬蟲',
        suspiciousLinks
      });
    }

    let allLinks=[...suspiciousLinks];
    let isVideo= !!ext.match(/\.(mp4|mov|avi|mkv|webm)$/i);
    if(isVideo){
      console.log('[scan] short video => frames => aggregator+fallback');
      try {
        const durSec= parseFloat(execSync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`
        ).toString().trim())||9999;
        if(durSec<=30){
          // 抽多幀
          const frameDir= path.join(localDir, `frames_${file.id}`);
          if(!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);
          const frames=await extractKeyFrames(localPath, frameDir, 10, 5);
          for(const fPath of frames){
            const aggregatorUrl=''; 
            const engineRes=await doSearchEngines(fPath, true, aggregatorUrl);
            allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
          }
        }
      } catch(eVid2){
        console.error('[video frames error]', eVid2);
      }
    } else {
      // 單張 => aggregator
      console.log('[scan] single image => aggregator+fallback');
      const aggregatorUrl=''; // 若有公網URL可放
      const engineRes= await doSearchEngines(localPath, true, aggregatorUrl);
      allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
    }

    const uniqueLinks=[...new Set(allLinks)];
    file.status='scanned';
    file.infringingLinks= JSON.stringify(uniqueLinks);
    await file.save();

    // 3) 產生掃描報告 PDF
    const scanPdfName= `scanReport_${file.id}.pdf`;
    const scanPdfPath= path.join(localDir, scanPdfName);
    const stampPath= path.join(__dirname, '../../public/stamp.png');

    await generateScanPDF(
      { file, suspiciousLinks:uniqueLinks, stampImagePath: fs.existsSync(stampPath)?stampPath:null },
      scanPdfPath
    );

    return res.json({
      message:'圖搜+文字爬蟲完成 => PDF OK',
      suspiciousLinks: uniqueLinks,
      scanReportUrl:`/api/protect/scanReports/${file.id}`
    });
  } catch(err){
    console.error('[scan error]', err);
    return res.status(500).json({ code:'SCAN_ERROR', error: err.message });
  }
});

// 下載掃描報告
router.get('/scanReports/:fileId', async(req,res)=>{
  try {
    const fileId= req.params.fileId;
    const localDir= path.resolve(__dirname, '../../uploads');
    const pdfPath= path.join(localDir, `scanReport_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ code:'NOT_FOUND', error:'報告不存在' });
    }
    res.download(pdfPath, `KaiKaiShield_ScanReport_${fileId}.pdf`);
  } catch(err){
    console.error('[scanReports error]', err);
    return res.status(500).json({ code:'REPORT_DOWNLOAD_ERROR', error: err.message });
  }
});

// (可選) /protect => 新示範
router.post('/protect', upload.single('file'), async(req,res)=>{
  // 您可在這裡進行 IPFS / Fingerprint / aggregator 皆一次完成
  return res.json({ success:true, message:'TODO: /protect One-Pass Flow' });
});

module.exports = router;
