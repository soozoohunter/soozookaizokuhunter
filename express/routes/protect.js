/*************************************************************
 * express/routes/protect.js
 *
 * - Puppeteer 新headless模式 + 內嵌 Base64 字型，避免 Docker 無字型時 PDF 出現亂碼
 * - Ginifab Aggregator + fallback to Direct Engines (Bing/TinEye/Baidu)
 * - TikTok 文字爬蟲
 * - 影片抽幀
 * - 產出 PDF（上傳證書 + 侵權掃描報告）
 * - 在 PDF 下方添加公司名稱「© 2025 凱盾全球國際股份有限公司 All Rights Reserved.」
 * - 在證書中顯示 SiriNumber 欄位 + 實際 SerialNumber
 * - Stamp (stamp.png) 旋轉 45°
 * - 修正 Bing / TinEye 檔案上傳 Selector
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
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const { extractKeyFrames } = require('../utils/extractFrames');

// ffmpeg
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// Multer 設定 (上傳限制100MB)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }
});

// 白名單
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

// =========== Puppeteer / PDF 產生相關 ===========
let base64TTF = ''; 
try {
  // 若您有自己的字型，可換檔名
  const fontBuffer = fs.readFileSync(path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf'));
  base64TTF = fontBuffer.toString('base64');
  console.log('[Font] Loaded NotoSansTC-VariableFont_wght.ttf as base64');
} catch(eFont) {
  console.error('[Font] Loading error =>', eFont);
}

const puppeteer = require('puppeteer');

/**
 * 產生「著作證明書」PDF
 * - 底部顯示公司名稱
 * - 蓋章 stamp.png 旋轉45度
 * - SiriNumber + SerialNumber
 */
async function generateCertificatePDF(data, outputPath) {
  const {
    name, dob, phone, address, email,
    title, fileName, fingerprint, ipfsHash, txHash,
    serial, mimeType, issueDate, filePath, stampImagePath
  } = data;

  // 假設您想顯示的 SiriNumber (可動態生成)
  const siriNumber = `Siri-2025-00088`;

  // 若為圖片 => Base64
  let previewImgTag = '';
  if (mimeType && mimeType.startsWith('image')) {
    const imgExt = path.extname(filePath).slice(1);
    const imgData = fs.readFileSync(filePath).toString('base64');
    previewImgTag = `<img src="data:image/${imgExt};base64,${imgData}" style="max-width:50%; margin:20px auto; display:block;" alt="Preview Image">`;
  } 
  // 若為影片 => 抽中間幀
  else if (mimeType && mimeType.startsWith('video')) {
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
        previewImgTag = `<img src="data:image/png;base64,${base64Vid}" style="max-width:50%; margin:20px auto; display:block;" alt="Video Preview">`;
      }
    } catch(eVid){
      console.error('[Video preview error]', eVid);
    }
  }

  // 內嵌 base64 字型
  const embeddedFontCSS = base64TTF
    ? `
      @font-face {
        font-family: "NotoSansTCVar";
        src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
      }
    `
    : `
      @font-face {
        font-family: "NotoSansTCVar", sans-serif;
      }
    `;

  // 加入公司名稱 + SiriNumber + stamp旋轉45度
  const htmlContent = `
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${embeddedFontCSS}
        body {
          font-family: "NotoSansTCVar", sans-serif;
          margin: 0; padding: 0;
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
          position: absolute;
          top: 0;
          left: 0;
          width: 100px;
          opacity: 0.9;
          transform: rotate(45deg); /* 旋轉45度 */
        }
        .field {
          font-size: 14px;
          margin: 6px 0;
        }
        .field-label {
          font-weight: bold;
        }
        .disclaimer {
          margin-top: 20px;
          font-size: 12px;
        }
        .footer-company {
          margin-top: 30px;
          font-size: 12px;
          color: #555;
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        ${
          stampImagePath
            ? `<img src="file://${stampImagePath}" class="stamp" alt="Stamp">`
            : ''
        }
        <div class="certificate-title">原創著作證明書 / Certificate of Copyright</div>

        <div class="field"><span class="field-label">真實姓名 (Name):</span> ${name}</div>
        <div class="field"><span class="field-label">生日 (Date of Birth):</span> ${dob||''}</div>
        <div class="field"><span class="field-label">手機 (Phone):</span> ${phone}</div>
        <div class="field"><span class="field-label">地址 (Address):</span> ${address||''}</div>
        <div class="field"><span class="field-label">Email:</span> ${email}</div>
        <div class="field"><span class="field-label">作品標題 (Title):</span> ${title}</div>
        <div class="field"><span class="field-label">檔名 (File Name):</span> ${fileName}</div>
        <div class="field"><span class="field-label">Fingerprint (SHA-256):</span> ${fingerprint}</div>
        <div class="field"><span class="field-label">IPFS Hash:</span> ${ipfsHash||'N/A'}</div>
        <div class="field"><span class="field-label">Tx Hash:</span> ${txHash||'N/A'}</div>

        <div class="field">
          <span class="field-label">序號 (Serial Number):</span>
          <span style="color: red;">${serial}</span>
        </div>

        <!-- Siri Number 顯示 -->
        <div class="field">
          <span class="field-label">SiriNumber:</span>
          <span style="color: blue;">${siriNumber}</span>
        </div>

        <div class="field"><span class="field-label">檔案型態 (MIME):</span> ${mimeType}</div>
        <div class="field"><span class="field-label">產生日期 (Issue Date):</span> ${issueDate}</div>
        ${previewImgTag}
        <div class="disclaimer">
          本證書根據國際著作權法及相關規定，具有全球法律效力。<br/>
          於台灣境內，依據《著作權法》之保護範圍，本證明同具法律效力。
        </div>

        <div class="footer-company">
          © 2025 凱盾全球國際股份有限公司 All Rights Reserved.
        </div>
      </div>
    </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
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
 * 產生「掃描報告」PDF
 * - 底部顯示公司名稱
 */
async function generateScanPDF({ file, suspiciousLinks }, outPath) {
  const browser = await puppeteer.launch({
    headless:'new',
    args:['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const embeddedFontCSS = base64TTF
    ? `
      @font-face {
        font-family: "NotoSansTCVar";
        src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
      }
    `
    : `
      @font-face {
        font-family: "NotoSansTCVar", sans-serif;
      }
    `;

  const htmlContent = `
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${embeddedFontCSS}
        body {
          font-family: "NotoSansTCVar", sans-serif;
          margin:0; padding:0; text-align:center;
        }
        h1 { margin-top:30px; }
        .links { text-align:left; width:60%; margin:0 auto; }
        .link-item { margin:3px 0; }
        .footer-company {
          margin-top:30px; font-size:12px; color:#666;
        }
      </style>
    </head>
    <body>
      <h1>偵測結果報告 / Scan Report</h1>
      <p>File ID: ${file.id}</p>
      <p>Filename: ${file.filename}</p>
      <p>Fingerprint: ${file.fingerprint}</p>
      <p>Status: ${file.status}</p>
      ${
        suspiciousLinks.length
          ? `<h3>可疑連結 (Possible matches):</h3>
             <div class="links">
               ${ suspiciousLinks.map(l=>`<div class="link-item">${l}</div>`).join('') }
             </div>`
          : `<p>未發現任何相似連結</p>`
      }
      <p style="font-size:12px; color:gray; margin-top:30px;">
        本報告由 SUZOO IP GUARD 侵權偵測系統自動生成。
      </p>
      <div class="footer-company">
        © 2025 凱盾全球國際股份有限公司 All Rights Reserved.
      </div>
    </body>
  </html>
  `;

  await page.setContent(htmlContent, { waitUntil:'networkidle0' });
  await page.pdf({ path:outPath, format:'A4', printBackground:true });
  await browser.close();
}

// ===================== /step1 上傳檔案 + Fingerprint + PDF =====================
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

    // 短影音 => 付費
    const mimeType = req.file.mimetype;
    const isVideo = mimeType.startsWith('video');
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);
    if(isVideo && !isUnlimited){
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ code:'NEED_PAYMENT', error:'短影音需付費方案' });
    }

    // 找/建 user
    let finalUser = await User.findOne({
      where: { [Op.or]: [{ email }, { phone }] }
    });
    if(!finalUser){
      const rawPass = phone + '@KaiShield';
      const hashedPass = await bcrypt.hash(rawPass, 10);
      finalUser = await User.create({
        username: phone,
        serialNumber:'SN-'+Date.now(),
        email, phone,
        password:hashedPass,
        realName, birthDate, address,
        role:'user', plan:'freeTrial'
      });
    }

    // fingerprint
    const fileBuf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(fileBuf);

    // fingerprint 重複?
    const existFile = await File.findOne({ where:{ fingerprint } });
    if(existFile){
      // 白名單可重複
      if(isUnlimited){
        fs.unlinkSync(req.file.path);
        return res.json({
          message:'已上傳過相同檔案(白名單允許重複)，回傳舊紀錄',
          fileId: existFile.id,
          pdfUrl:`/api/protect/certificates/${existFile.id}`,
          fingerprint:existFile.fingerprint,
          ipfsHash:existFile.ipfs_hash,
          txHash:existFile.tx_hash,
          defaultPassword:null
        });
      } else {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({
          code:'FINGERPRINT_DUPLICATE',
          error:'已上傳過相同檔案(相同 SHA-256)，請勿重複上傳'
        });
      }
    }

    // IPFS & 區塊鏈
    let ipfsHash=null, txHash=null;
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch(eIPFS){ console.error('[IPFS error]', eIPFS); }
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash||'');
      txHash = receipt?.transactionHash || null;
    } catch(eChain){
      console.error('[Chain error]', eChain);
    }

    // 建 File
    const newFile = await File.create({
      user_id: finalUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash,
      status:'pending'
    });
    if(isVideo) finalUser.uploadVideos++;
    else finalUser.uploadImages++;
    await finalUser.save();

    // 移動檔案 => /uploads/
    const ext = path.extname(req.file.originalname)||'';
    const localDir = path.resolve(__dirname, '../../uploads');
    if(!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive:true });
    const targetPath = path.join(localDir, `imageForSearch_${newFile.id}${ext}`);
    fs.renameSync(req.file.path, targetPath);

    // 影片(<=30s) => 抽中間幀
    let finalPreviewPath=null;
    if(isVideo){
      try {
        const cmdProbe = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${targetPath}"`;
        const durSec = parseFloat(execSync(cmdProbe).toString().trim())||9999;
        if(durSec<=30){
          const tmpFrameDir = path.join(localDir, 'tmpFrames');
          if(!fs.existsSync(tmpFrameDir)) fs.mkdirSync(tmpFrameDir);
          const outThumbPath = path.join(tmpFrameDir, `thumb_${newFile.id}.png`);
          const timeSec = Math.floor(durSec/2);
          execSync(`ffmpeg -i "${targetPath}" -ss ${timeSec} -frames:v 1 "${outThumbPath}"`);
          if(fs.existsSync(outThumbPath)){
            finalPreviewPath=outThumbPath;
          }
        }
      } catch(eVid){ console.error('[Video middle frame error]', eVid); }
    } else {
      finalPreviewPath=targetPath;
    }

    // 產 PDF
    const stampImagePath = path.join(__dirname, '../../public/stamp.png');
    const pdfFileName = `certificate_${newFile.id}.pdf`;
    const pdfFilePath = path.join(localDir, pdfFileName);

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
      filePath: finalPreviewPath||targetPath,
      stampImagePath: fs.existsSync(stampImagePath)? stampImagePath:null
    }, pdfFilePath);

    const defaultPassword = (existFile || (finalUser && finalUser.id)) ? null : (phone+'@KaiShield');
    return res.json({
      message:'上傳成功並完成 PDF！',
      fileId:newFile.id,
      pdfUrl:`/api/protect/certificates/${newFile.id}`,
      fingerprint,
      ipfsHash,
      txHash,
      defaultPassword
    });
  } catch(err){
    if(err.code==='LIMIT_FILE_SIZE'){
      return res.status(413).json({ code:'FILE_TOO_LARGE', error:'檔案過大' });
    }
    console.error('[step1 error]', err);
    return res.status(500).json({ code:'STEP1_ERROR', error:err.message||'未知錯誤' });
  }
});

/***************************************************
 * GET /certificates/:fileId => 下載 PDF 證書
 ***************************************************/
router.get('/certificates/:fileId', async(req, res)=>{
  try {
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath = path.join(localDir, `certificate_${req.params.fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ code:'PDF_NOT_FOUND', error:'PDF 不存在' });
    }
    res.download(pdfPath, `KaiKaiShield_Certificate_${req.params.fileId}.pdf`);
  } catch(err){
    console.error('[Download PDF error]', err);
    return res.status(500).json({ code:'DOWNLOAD_ERROR', error:err.message });
  }
});

/***************************************************
 * aggregator + fallback + TikTok + 影片抽幀 => 報告
 ***************************************************/

// -- aggregator: Ginifab 
async function aggregatorSearchGinifab(browser, imageUrl) {
  // 簡化示範: 三次重試
  const results = {
    bing: { success:false, links:[], screenshot:'' },
    tineye: { success:false, links:[], screenshot:'' },
    baidu: { success:false, links:[], screenshot:'' }
  };
  for(let attempt=1; attempt<=3; attempt++){
    let page=null;
    try {
      page = await browser.newPage();
      await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/',
        { waitUntil:'domcontentloaded', timeout:15000 });
      await page.waitForTimeout(1000);

      // 指定圖片網址
      await page.evaluate(()=>{
        const link = [...document.querySelectorAll('a')]
          .find(a => a.innerText.includes('指定圖片網址'));
        if(link) link.click();
      });
      await page.waitForSelector('input[type=text]', { timeout:8000 });
      await page.type('input[type=text]', imageUrl, {delay:50});
      await page.waitForTimeout(800);

      const engineList = [
        { name:'bing',   regex:/必應|Bing/i },
        { name:'tineye', regex:/錫眼睛|TinEye/i },
        { name:'baidu',  regex:/百度|Baidu/i }
      ];

      for (const eng of engineList) {
        try {
          const newPagePromise = new Promise(resolve=>{
            browser.once('targetcreated', t=>resolve(t.page()));
          });
          // 點擊 => new tab
          await page.evaluate((rgx)=>{
            const link = [...document.querySelectorAll('a')]
              .find(a => new RegExp(rgx,'i').test(a.innerText));
            if(link) link.click();
          }, eng.regex.source);

          const popupPage = await newPagePromise;
          await popupPage.bringToFront();
          await popupPage.waitForTimeout(3000);

          let shotPath = path.join('uploads', `${eng.name}_via_ginifab_${Date.now()}.png`);
          await popupPage.screenshot({ path:shotPath, fullPage:true }).catch(()=>{});

          let hrefs=await popupPage.$$eval('a', as=>as.map(a=>a.href));
          hrefs=hrefs.filter(h => h && !h.includes('ginifab') && !h.includes('bing.com') && !h.includes('tineye.com') && !h.includes('baidu.com'));
          let top5=hrefs.slice(0,5);
          results[eng.name] = { success:true, links:top5, screenshot:shotPath };
          await popupPage.close();
        } catch(subErr){
          console.error('[Ginifab aggregator sub-engine fail]', eng.name, subErr);
        }
      }
      await page.close();
      break; 
    } catch(err){
      console.error('[aggregator ginifab attempt]', attempt, err);
      if(page) await page.close().catch(()=>{});
    }
  }
  return results;
}

// -- direct: Bing
async function directSearchBing(browser, imagePath){
  let ret = { success:false, links:[], screenshot:'' };
  for(let attempt=1; attempt<=3; attempt++){
    let page=null;
    try{
      page=await browser.newPage();
      await page.goto('https://www.bing.com/images', {waitUntil:'domcontentloaded', timeout:15000});
      await page.waitForTimeout(1000);
      // #sb_sbi => 相機按鈕
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('#sb_sbi')
      ]);
      await fileChooser.accept([imagePath]);
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
      await page.waitForTimeout(2000);

      let shotPath = path.join('uploads', `bing_direct_${Date.now()}.png`);
      await page.screenshot({ path:shotPath, fullPage:true }).catch(()=>{});
      
      let links = await page.$$eval('a', as=>as.map(a=>a.href));
      links=links.filter(l=>l && !l.includes('bing.com')).slice(0,5);
      ret={ success:true, links, screenshot:shotPath };
      await page.close();
      break;
    } catch(err){
      console.error('[Direct Bing attempt]', attempt, err);
      if(page) await page.close();
    }
  }
  return ret;
}

// -- direct: TinEye
async function directSearchTinEye(browser, imagePath){
  let ret={ success:false, links:[], screenshot:'' };
  for(let attempt=1; attempt<=3; attempt++){
    let page=null;
    try{
      page=await browser.newPage();
      await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded', timeout:15000});
      // input[type=file]
      const fileInput=await page.waitForSelector('input[type=file]', {timeout:8000});
      await fileInput.uploadFile(imagePath);

      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:15000 }).catch(()=>{});
      await page.waitForTimeout(2000);

      let shotPath=path.join('uploads', `tineye_direct_${Date.now()}.png`);
      await page.screenshot({ path:shotPath, fullPage:true }).catch(()=>{});
      
      let links=await page.$$eval('a', as=>as.map(a=>a.href));
      links=links.filter(l=>l && !l.includes('tineye.com')).slice(0,5);
      ret={success:true, links, screenshot:shotPath};
      await page.close();
      break;
    } catch(err){
      console.error('[Direct TinEye attempt]', attempt, err);
      if(page) await page.close();
    }
  }
  return ret;
}

// -- direct: Baidu
async function directSearchBaidu(browser, imagePath){
  let ret={success:false, links:[], screenshot:''};
  for(let attempt=1; attempt<=3; attempt++){
    let page=null;
    try{
      page=await browser.newPage();
      await page.goto('https://image.baidu.com/', { waitUntil:'domcontentloaded', timeout:15000 });
      await page.waitForTimeout(1000);
      // .soutu-btn => 相機
      const cameraBtn=await page.waitForSelector('span.soutu-btn',{timeout:8000});
      await cameraBtn.click();
      const fileInput=await page.waitForSelector('input#uploadImg, input[type=file]', {timeout:8000});
      await fileInput.uploadFile(imagePath);

      await page.waitForTimeout(5000);
      let shotPath=path.join('uploads',`baidu_direct_${Date.now()}.png`);
      await page.screenshot({ path:shotPath, fullPage:true }).catch(()=>{});

      let links=await page.$$eval('a', as=> as.map(a=>a.href));
      links=links.filter(l=>l && !l.includes('baidu.com')).slice(0,5);
      ret={success:true, links, screenshot:shotPath};
      await page.close();
      break;
    } catch(err){
      console.error('[Direct Baidu attempt]', attempt, err);
      if(page) await page.close();
    }
  }
  return ret;
}

/**
 * 執行 aggregator(可選) + fallback
 * aggregator => aggregatorSearchGinifab
 * direct => Bing/TinEye/Baidu
 */
async function doSearchEngines(localFilePath, aggregatorFirst, aggregatorImageUrl='') {
  const puppeteerBrowser = await puppeteer.launch({
    headless:true,
    args:['--no-sandbox','--disable-setuid-sandbox']
  });

  let final = {
    bing:   {success:false, links:[], screenshot:''},
    tineye: {success:false, links:[], screenshot:''},
    baidu:  {success:false, links:[], screenshot:''}
  };

  if(aggregatorFirst && aggregatorImageUrl){
    const aggregatorResult = await aggregatorSearchGinifab(puppeteerBrowser, aggregatorImageUrl);
    const successCount = ['bing','tineye','baidu'].filter(n=>aggregatorResult[n].success).length;
    if(successCount>0){
      final.bing   = aggregatorResult.bing;
      final.tineye = aggregatorResult.tineye;
      final.baidu  = aggregatorResult.baidu;
      // fallback 只補失敗
      if(!aggregatorResult.bing.success){
        let rBing=await directSearchBing(puppeteerBrowser, localFilePath);
        final.bing=rBing;
      }
      if(!aggregatorResult.tineye.success){
        let rTE=await directSearchTinEye(puppeteerBrowser, localFilePath);
        final.tineye=rTE;
      }
      if(!aggregatorResult.baidu.success){
        let rBd=await directSearchBaidu(puppeteerBrowser, localFilePath);
        final.baidu=rBd;
      }
      await puppeteerBrowser.close();
      return final;
    }
  }
  // fallback => direct
  let rBing=await directSearchBing(puppeteerBrowser, localFilePath);
  let rTinEye=await directSearchTinEye(puppeteerBrowser, localFilePath);
  let rBaidu=await directSearchBaidu(puppeteerBrowser, localFilePath);
  final.bing=rBing;
  final.tineye=rTinEye;
  final.baidu=rBaidu;

  await puppeteerBrowser.close();
  return final;
}

// /scan/:fileId => aggregator + fallback + TikTok + 影片抽幀 => 產PDF報告
router.get('/scan/:fileId', async(req,res)=>{
  try {
    const file=await File.findByPk(req.params.fileId);
    if(!file){ return res.status(404).json({ code:'FILE_NOT_FOUND', error:'無此FileID' }); }

    // 1) TikTok
    let suspiciousLinks=[];
    if(process.env.RAPIDAPI_KEY){
      try{
        const searchQuery=file.filename||file.fingerprint||'default';
        console.log('[TikTok] start searching =>',searchQuery);
        const rTT=await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search',{
          params:{keywords:searchQuery, region:'us', count:'5'},
          headers:{
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host':'tiktok-scraper7.p.rapidapi.com'
          }
        });
        console.log('[TikTok] response =>',rTT.data);
        const tiktokItems=rTT.data?.videos||[];
        tiktokItems.forEach(v=>{ if(v.link) suspiciousLinks.push(v.link); });
      }catch(eTT){
        console.error('[TikTok crawler error]', eTT);
      }
    } else {
      console.warn('[TikTok] No RAPIDAPI_KEY => skip');
    }

    // 2) aggregator + fallback
    const localDir=path.resolve(__dirname, '../../uploads');
    const ext=path.extname(file.filename)||'';
    const localPath=path.join(localDir,`imageForSearch_${file.id}${ext}`);
    if(!fs.existsSync(localPath)){
      file.status='scanned';
      file.infringingLinks=JSON.stringify(suspiciousLinks);
      await file.save();
      return res.json({
        message:'原始檔不存在 => 只做文字爬蟲',
        suspiciousLinks
      });
    }

    let allLinks=[...suspiciousLinks];
    let isVideo=false;
    if(ext.match(/\.(mp4|mov|avi|mkv|webm)$/i)) isVideo=true;

    if(isVideo){
      console.log('[Scan] short video => frames...');
      try{
        const durSec=parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`).toString().trim())||9999;
        console.log('[Scan] video duration =>', durSec);
        if(durSec<=30){
          const outDir=path.join(localDir,`frames_${file.id}`);
          if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);
          const frames=await extractKeyFrames(localPath,outDir,10);
          console.log('[Scan] extracted frames =>', frames.length);

          for(const framePath of frames){
            console.log('[Scan] aggregator + fallback =>', path.basename(framePath));
            // aggregatorFirst=true => 先試 aggregator (需上傳 imageUrl？)
            let aggregatorUrl='';
            let engineRes=await doSearchEngines(framePath,true,aggregatorUrl);
            allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
          }
        }
      } catch(eVid2){
        console.error('[video frames error]', eVid2);
      }
    } else {
      console.log('[Scan] single image => aggregator + fallback');
      let aggregatorUrl=''; // 若您想先上傳 Cloudinary => aggregatorUrl=...
      let engineRes=await doSearchEngines(localPath,true,aggregatorUrl);
      allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
    }

    const uniqueLinks=[...new Set(allLinks)];
    file.status='scanned';
    file.infringingLinks=JSON.stringify(uniqueLinks);
    await file.save();

    // 產生掃描報告 PDF
    const scanPdfName=`scanReport_${file.id}.pdf`;
    const scanPdfPath=path.join(localDir, scanPdfName);
    await generateScanPDF({ file, suspiciousLinks:uniqueLinks }, scanPdfPath);

    return res.json({
      message:'圖搜+文字爬蟲完成 => PDF ok',
      suspiciousLinks: uniqueLinks,
      scanReportUrl: `/api/protect/scanReports/${file.id}`
    });
  } catch(err){
    console.error('[scan error]', err);
    return res.status(500).json({ code:'SCAN_ERROR', error: err.message });
  }
});

/***************************************************
 * GET /scanReports/:fileId => 下載掃描報告
 ***************************************************/
router.get('/scanReports/:fileId', async(req,res)=>{
  try{
    const localDir=path.resolve(__dirname,'../../uploads');
    const pdfPath=path.join(localDir, `scanReport_${req.params.fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({code:'NOT_FOUND', error:'報告不存在'});
    }
    res.download(pdfPath, `KaiKaiShield_ScanReport_${req.params.fileId}.pdf`);
  }catch(err){
    console.error('[download scan pdf error]', err);
    return res.status(500).json({ code:'DOWNLOAD_SCAN_PDF_ERROR', error: err.message });
  }
});

module.exports = router;
