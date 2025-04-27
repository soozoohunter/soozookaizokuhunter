/*************************************************************
 * express/routes/protect.js
 *
 * - 改用 Puppeteer + HTML template 產生 PDF (center-align, black underline)
 * - 若影片且長度 <=30s，擷取中間幀做預覽
 * - Fingerprint 重複：白名單可複用，非白名單擋
 * - 使用三保險 fallback (Cloudinary + GinifabEngine => fallback => multiEngineReverseImage)
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

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// 引入原本的多引擎搜圖 (direct對Bing/TinEye/Baidu)
const { doMultiReverseImage } = require('../utils/multiEngineReverseImage');

// 如要使用 fallback，請確定您有實作以下檔案：scanFileWithFallback.js
// const { scanFileWithFallback } = require('../utils/scanFileWithFallback');

// Multer: 上傳限制 100 MB
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }
});

// 白名單
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

/***************************************************
 * Part A: 產生 PDF (Puppeteer + HTML Template)
 ***************************************************/
const puppeteer = require('puppeteer');
// 使用繁中字型
const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');

/**
 * 以 HTML template 產生 PDF
 * @param {object} data
 * @param {string} outputPath
 */
async function generateCertificatePDF(data, outputPath) {
  const {
    name, dob, phone, address, email,
    title, fileName, fingerprint, ipfsHash, txHash,
    serial, mimeType, issueDate, filePath, stampImagePath
  } = data;

  // 如果是圖片 => base64
  let previewImgTag = '';
  if (mimeType && mimeType.startsWith('image')) {
    const imgExt = path.extname(filePath).slice(1);
    const imgData = fs.readFileSync(filePath).toString('base64');
    previewImgTag = `<img src="data:image/${imgExt};base64,${imgData}" style="max-width: 50%; margin:20px auto; display:block;" alt="Preview Image">`;
  } else if (mimeType && mimeType.startsWith('video')) {
    // 影片 => 擷取中間幀
    const thumbDir = path.join(__dirname, '../../uploads/tmp');
    if(!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive:true });
    const thumbPath = path.join(thumbDir, `thumb_${serial}.png`);
    try {
      await new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .on('end', resolve)
          .on('error', reject)
          .screenshots({
            timestamps:['50%'],
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

  const htmlContent = `
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @font-face {
          font-family: "NotoSansTCVar";
          src: url("file://${fontPath}") format("truetype");
        }
        body {
          font-family: "NotoSansTCVar", sans-serif;
          margin:0; padding:0;
        }
        .certificate-container {
          position:relative; width:80%; margin:0 auto; text-align:center; padding:40px 0;
        }
        .certificate-title {
          font-size:24px; font-weight:bold;
          margin-bottom:20px; padding-bottom:5px;
          border-bottom:2px solid #000;
        }
        .stamp {
          position:absolute; top:0; left:0; width:100px; opacity:0.9;
        }
        .field { font-size:14px; margin:6px 0; }
        .field-label { font-weight:bold; }
        .disclaimer { margin-top:20px; font-size:12px; }
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
        <div class="field"><span class="field-label">序號 (Serial):</span><span style="color:red;">${serial}</span></div>
        <div class="field"><span class="field-label">檔案型態 (MIME):</span> ${mimeType}</div>
        <div class="field"><span class="field-label">產生日期 (Issue Date):</span> ${issueDate}</div>
        ${previewImgTag}
        <div class="disclaimer">
          本證書根據國際著作權法及相關規定，具有全球法律效力。<br/>
          於台灣境內，依據《著作權法》之保護範圍，本證明同具法律效力。
        </div>
      </div>
    </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    headless:true,
    args:['--no-sandbox','--disable-setuid-sandbox']
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

/***************************************************
 * /api/protect/step1 => 上傳 + 產 PDF
 ***************************************************/
router.post('/step1', upload.single('file'), async (req, res)=>{
  try {
    if(!req.file){
      return res.status(400).json({ code:'NO_FILE_OR_TOO_BIG', error:'請上傳檔案或檔案過大' });
    }
    // 必填欄位
    const { realName, birthDate, phone, address, email, title, keywords, agreePolicy } = req.body;
    if(!realName||!birthDate||!phone||!address||!email){
      return res.status(400).json({ code:'EMPTY_REQUIRED', error:'缺少必填欄位(個人資料)' });
    }
    if(!title){
      return res.status(400).json({ code:'NO_TITLE', error:'請輸入作品標題' });
    }
    if(agreePolicy!=='true'){
      return res.status(400).json({ code:'POLICY_REQUIRED', error:'請勾選同意隱私權政策與使用條款' });
    }

    // 短影音 => 付費判斷
    const mimeType = req.file.mimetype;
    const isVideo = mimeType.startsWith('video');
    const isUnlimited = ALLOW_UNLIMITED.includes(phone)||ALLOW_UNLIMITED.includes(email);
    if(isVideo && !isUnlimited){
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ code:'NEED_PAYMENT', error:'短影音上傳需付費，請聯繫客服或升級付費方案' });
    }

    // 找/建 user
    let finalUser = null;
    const oldUser = await User.findOne({
      where:{ [Op.or]:[{ email},{ phone}] }
    });
    if(oldUser){
      finalUser = oldUser;
    } else {
      // 建新 user
      const rawPass = phone+'@KaiShield';
      const hashedPass = await bcrypt.hash(rawPass, 10);
      finalUser = await User.create({
        username: phone,
        serialNumber:'SN-'+ Date.now(),
        email, phone,
        password: hashedPass,
        realName, birthDate, address,
        role:'user', plan:'freeTrial'
      });
    }

    // Fingerprint
    const fileBuf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(fileBuf);

    // fingerprint 重複
    const existFile = await File.findOne({ where:{ fingerprint } });
    if(existFile){
      // 白名單 => 直接回傳舊紀錄
      if(isUnlimited){
        fs.unlinkSync(req.file.path);
        return res.json({
          message:'已上傳過相同檔案(白名單允許重複)，回傳舊紀錄',
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
          error:'已上傳過相同檔案(相同SHA-256)，請勿重複上傳'
        });
      }
    }

    // IPFS & 區塊鏈
    let ipfsHash=null, txHash=null;
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch(eIPFS){
      console.error('[IPFS error]', eIPFS);
    }
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash||'');
      txHash = receipt?.transactionHash||null;
    } catch(eChain){
      console.error('[Chain error]', eChain);
    }

    // 建立 File 紀錄
    const newFile = await File.create({
      user_id: finalUser.id,
      filename:req.file.originalname,
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

    // 影片 => 抽中間幀
    let finalPreviewPath = null;
    if(isVideo){
      try {
        const cmdProbe = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${targetPath}"`;
        const durSec = parseFloat(execSync(cmdProbe).toString().trim())||9999;
        if(durSec<=30){
          const tmpFrameDir = path.join(localDir,'tmpFrames');
          if(!fs.existsSync(tmpFrameDir)) fs.mkdirSync(tmpFrameDir);
          const outThumbPath = path.join(tmpFrameDir,`thumb_${newFile.id}.png`);
          const timeSec = Math.floor(durSec/2);
          execSync(`ffmpeg -i "${targetPath}" -ss ${timeSec} -frames:v 1 "${outThumbPath}"`);
          if(fs.existsSync(outThumbPath)){
            finalPreviewPath = outThumbPath;
          }
        }
      } catch(eVid){
        console.error('[Video middle frame error]', eVid);
      }
    } else {
      finalPreviewPath = targetPath;
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
      stampImagePath: fs.existsSync(stampImagePath)?stampImagePath:null
    }, pdfFilePath);

    // 新用戶 => 回傳預設密碼
    const defaultPassword = oldUser?null:(phone+'@KaiShield');

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
    console.error('[step1 error]',err);
    return res.status(500).json({ code:'STEP1_ERROR', error:err.message||'未知錯誤' });
  }
});

/***************************************************
 * 下載 PDF 證書
 ***************************************************/
router.get('/certificates/:fileId', async (req,res)=>{
  try {
    const localDir = path.resolve(__dirname,'../../uploads');
    const pdfPath = path.join(localDir, `certificate_${req.params.fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ code:'PDF_NOT_FOUND', error:'PDF 證書不存在' });
    }
    res.download(pdfPath, `KaiKaiShield_Certificate_${req.params.fileId}.pdf`);
  } catch(err){
    console.error('[Download PDF error]', err);
    return res.status(500).json({ code:'DOWNLOAD_ERROR', error:err.message });
  }
});

/***************************************************
 * /api/protect/scan/:fileId => 多引擎搜圖 + 文字爬蟲 + 產 ScanReport
 ***************************************************/

// 可取消註解 => 若要使用 fallback
// const { scanFileWithFallback } = require('../utils/scanFileWithFallback');

router.get('/scan/:fileId', async (req, res)=>{
  try {
    const file = await File.findByPk(req.params.fileId);
    if(!file){
      return res.status(404).json({ code:'FILE_NOT_FOUND', error:'無此FileID' });
    }

    // TikTok爬蟲
    let suspiciousLinks = [];
    const apiKey = process.env.RAPIDAPI_KEY;
    if(apiKey){
      try {
        const searchQuery = file.filename || file.fingerprint || 'default';
        const rTT = await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search',{
          params:{ keywords:searchQuery, region:'us', count:'5' },
          headers:{
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host':'tiktok-scraper7.p.rapidapi.com'
          }
        });
        const tiktokItems = rTT.data?.videos||[];
        tiktokItems.forEach(v=>{ if(v.link) suspiciousLinks.push(v.link); });
      } catch(eTT){
        console.error('[TikTok crawler error]', eTT);
      }
    }

    // 檔案
    const localDir = path.resolve(__dirname,'../../uploads');
    const ext = path.extname(file.filename)||'';
    const localPath = path.join(localDir, `imageForSearch_${file.id}${ext}`);
    if(!fs.existsSync(localPath)){
      file.status='scanned';
      file.infringingLinks= JSON.stringify([]);
      await file.save();
      return res.json({
        message:'原始檔不存在 => 僅文字爬蟲',
        suspiciousLinks:[]
      });
    }

    let allLinks = [...suspiciousLinks];
    let isVideo = false;
    if(ext.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
      isVideo = true;
    }

    if(isVideo){
      try {
        const cmdProbe = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durSec = parseFloat(execSync(cmdProbe).toString().trim())||9999;
        if(durSec<=30){
          const outDir = path.join(localDir, `frames_${file.id}`);
          if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);

          // 抽幀
          const frames = await extractKeyFrames(localPath, outDir, 10);

          for(const framePath of frames){
            // 如果要啟用 fallback => scanFileWithFallback
            // 否則維持 doMultiReverseImage
            // e.g. let found = await doMultiReverseImage(framePath, file.id);

            // (A) fallback => 
            // let fallbackResult = await scanFileWithFallback(framePath, file.id);
            // if(fallbackResult.approach==='cloudy+ginifab'){
            //   let combined = [
            //     ...(fallbackResult.bingLinks||[]),
            //     ...(fallbackResult.tineyeLinks||[]),
            //     ...(fallbackResult.baiduLinks||[])
            //   ];
            //   allLinks.push(...combined);
            // } else {
            //   allLinks.push(...(fallbackResult.links||[]));
            // }

            // (B) 現行 direct => doMultiReverseImage
            const found = await doMultiReverseImage(framePath, file.id);
            allLinks.push(...found);
          }
        }
      } catch(eVid){
        console.error('[video frames error]', eVid);
      }
    } else {
      // 單張 => fallback or direct
      // e.g. fallback:
      // let fallbackResult = await scanFileWithFallback(localPath, file.id);
      // if(fallbackResult.approach==='cloudy+ginifab'){
      //   allLinks.push(...(fallbackResult.bingLinks||[]));
      //   allLinks.push(...(fallbackResult.tineyeLinks||[]));
      //   allLinks.push(...(fallbackResult.baiduLinks||[]));
      // } else {
      //   allLinks.push(...(fallbackResult.links||[]));
      // }

      // 現行 direct => 
      const found = await doMultiReverseImage(localPath, file.id);
      allLinks.push(...found);
    }

    const uniqueLinks = [...new Set(allLinks)];
    file.status='scanned';
    file.infringingLinks = JSON.stringify(uniqueLinks);
    await file.save();

    // 產掃描報告 PDF
    const scanPdfName = `scanReport_${file.id}.pdf`;
    const scanPdfPath = path.join(localDir, scanPdfName);
    await generateScanPDF({ file, suspiciousLinks: uniqueLinks }, scanPdfPath);

    return res.json({
      message:'圖搜 + 文字爬蟲完成 => 已產生掃描報告PDF',
      suspiciousLinks: uniqueLinks,
      scanReportUrl:`/api/protect/scanReports/${file.id}`
    });

  } catch(err){
    console.error('[scan error]', err);
    return res.status(500).json({ code:'SCAN_ERROR', error: err.message });
  }
});

/***************************************************
 * GET /scanReports/:fileId => 提供下載
 ***************************************************/
router.get('/scanReports/:fileId', async (req,res)=>{
  try {
    const localDir = path.resolve(__dirname,'../../uploads');
    const pdfPath = path.join(localDir, `scanReport_${req.params.fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ code:'NOT_FOUND', error:'掃描報告不存在' });
    }
    res.download(pdfPath, `KaiKaiShield_ScanReport_${req.params.fileId}.pdf`);
  } catch(err){
    console.error('[download scan pdf error]', err);
    return res.status(500).json({ code:'DOWNLOAD_SCAN_PDF_ERROR', error:err.message });
  }
});

/***************************************************
 * 以 Puppeteer 動態生成「掃描報告 PDF」
 ***************************************************/
async function generateScanPDF({ file, suspiciousLinks }, outPath) {
  const browser = await puppeteer.launch({ headless:true, args:['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const htmlContent = `
  <html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      @font-face {
        font-family: "NotoSansTCVar";
        src: url("file://${fontPath}") format("truetype");
      }
      body {
        font-family: "NotoSansTCVar", sans-serif;
        text-align:center; margin:0; padding:0;
      }
      h1 { margin-top:30px; }
      .links{ text-align:left; width:60%; margin:0 auto; }
      .link-item{ margin:3px 0; }
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
    <p style="font-size:12px; color:gray; margin-top:40px;">
      本報告由 SUZOO IP GUARD 侵權偵測系統自動生成。
    </p>
  </body>
  </html>
  `;

  await page.setContent(htmlContent,{ waitUntil:'networkidle0' });
  await page.pdf({ path: outPath, format:'A4', printBackground:true });
  await browser.close();
}

module.exports = router;
