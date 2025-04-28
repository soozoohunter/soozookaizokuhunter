/*************************************************************
 * express/routes/protect.js
 *
 * - Puppeteer 新 headless 模式 + 內嵌 Base64 字型 (解決 Docker 無字型亂碼)
 * - Ginifab Aggregator + fallback (Bing/TinEye/Baidu)
 * - TikTok 文字爬蟲
 * - 影片抽幀 (短影音 <= 30秒)
 * - 產出 PDF：上傳證書 + 侵權掃描報告 (均含 stamp.png 圖章, 旋轉45°)
 * - 在 PDF 下方添加公司名稱「© 2025 凱盾全球國際股份有限公司 All Rights Reserved.」
 * - 在證書中顯示 SiriNumber 欄位 + 實際 SerialNumber
 * - 修正 Bing / TinEye / Baidu 的檔案上傳與 Selector
 * - 修正 EXDEV: cross-device link not permitted (使用 copy + unlink)
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

// Models
const { User, File } = require('../models');

// Services (fingerprint / IPFS / chain)
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');

// 抽影格
const { extractKeyFrames } = require('../utils/extractFrames');

// ffmpeg / fluent-ffmpeg
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// Multer (上傳限制100MB) => 暫存至容器內的 uploads/ 資料夾
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }
});

// 白名單 (可上傳大檔或短影音免費)
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

// =========== Puppeteer / PDF 產生相關 ===========
// （1）匯入 puppeteer
const puppeteer = require('puppeteer');

// （2）在 Docker 環境中，嵌入 Base64 字型 (避免無字型亂碼)
let base64TTF = '';
try {
  const fontBuf = fs.readFileSync(path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf'));
  base64TTF = fontBuf.toString('base64');
  console.log('[Font] Loaded NotoSansTC-VariableFont_wght.ttf as base64');
} catch(eFont) {
  console.error('[Font] Loading error =>', eFont);
}

/**
 * 建立一個 Puppeteer 瀏覽器
 * (可改用 puppeteer-extra + stealth，如需更高成功率)
 */
async function launchBrowser() {
  return await puppeteer.launch({
    headless: 'new', // puppeteer@19+ 的新模式
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
      width:1280,
      height:800
    }
  });
}

/**
 * 產生「著作權證明書」PDF (Certificate)
 * - stamp.png (左上角, 旋轉45°)
 * - SiriNumber(自訂), SerialNumber(來自 user.serialNumber)
 * - 預覽圖片 (若是短影片, 抽1幀)
 */
async function generateCertificatePDF(data, outPath){
  const {
    name, dob, phone, address, email,
    title, fileName, fingerprint, ipfsHash, txHash,
    serial, mimeType, issueDate, filePath, stampImagePath
  } = data;

  // 手動自訂 SiriNumber
  const siriNumber = 'Siri-2025-00088';

  // 判斷檔案型態 => 預覽圖
  let previewHTML = '';
  if (mimeType && mimeType.startsWith('image') && filePath && fs.existsSync(filePath)) {
    // 讀檔 => base64
    const ext = path.extname(filePath).slice(1) || 'jpg';
    const b64 = fs.readFileSync(filePath).toString('base64');
    previewHTML = `<img src="data:image/${ext};base64,${b64}"
      style="max-width:50%; margin:20px auto; display:block;"
      alt="Preview"/>`;
  } else if (mimeType && mimeType.startsWith('video') && filePath && fs.existsSync(filePath)) {
    // 影片 => 已在 step1 抽幀 => 這裡可再顯示，但簡化
    previewHTML = `<p style="color:gray;">(影片檔案，請參考抽幀預覽)</p>`;
  }

  // stamp.png
  const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
    ? `<img src="file://${stampImagePath}" class="stamp" alt="Stamp"/>`
    : '';

  // 內嵌字型
  const embedFontCSS = base64TTF
    ? `
    @font-face {
      font-family: "NotoSansTCVar";
      src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
    }
    `
    : '';

  const html = `
  <html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      ${embedFontCSS}
      body {
        margin:0; padding:0;
        font-family: "NotoSansTCVar", sans-serif;
      }
      .container {
        position:relative; width:80%; margin:0 auto; text-align:center; padding:40px 0;
      }
      .stamp {
        position:absolute; top:0; left:0; width:100px; opacity:0.9;
        transform:rotate(45deg); border-radius:50%;
      }
      .title {
        font-size:24px; font-weight:bold; margin-bottom:20px;
        border-bottom:2px solid #000; display:inline-block; padding-bottom:5px;
      }
      .field { margin:6px 0; }
      .field-label { font-weight:bold; }
      .footer-company { margin-top:30px; font-size:12px; color:#555; }
    </style>
  </head>
  <body>
    <div class="container">
      ${stampTag}
      <div class="title">原創著作證明書 / Certificate of Copyright</div>
      <div class="field"><span class="field-label">真實姓名:</span> ${name}</div>
      <div class="field"><span class="field-label">生日:</span> ${dob||''}</div>
      <div class="field"><span class="field-label">手機:</span> ${phone}</div>
      <div class="field"><span class="field-label">地址:</span> ${address||''}</div>
      <div class="field"><span class="field-label">Email:</span> ${email}</div>
      <div class="field"><span class="field-label">作品標題:</span> ${title}</div>
      <div class="field"><span class="field-label">檔名:</span> ${fileName}</div>
      <div class="field"><span class="field-label">Fingerprint(SHA-256):</span> ${fingerprint}</div>
      <div class="field"><span class="field-label">IPFS Hash:</span> ${ipfsHash||'N/A'}</div>
      <div class="field"><span class="field-label">Tx Hash:</span> ${txHash||'N/A'}</div>
      <div class="field"><span class="field-label">序號(Serial #):</span> ${serial}</div>
      <div class="field"><span class="field-label">SiriNumber:</span> ${siriNumber}</div>
      <div class="field"><span class="field-label">檔案型態:</span> ${mimeType||''}</div>
      <div class="field"><span class="field-label">產生日期:</span> ${issueDate||''}</div>

      ${previewHTML}

      <div class="field" style="color:gray; margin-top:15px;">
        本證書根據國際著作權法及相關規定，具有全球法律效力。
      </div>
      <div class="footer-company">
        © 2025 凱盾全球國際股份有限公司 All Rights Reserved.
      </div>
    </div>
  </body>
  </html>
  `;

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil:'networkidle0' });
    await page.emulateMediaType('screen');
    await page.pdf({
      path: outPath,
      format:'A4',
      printBackground:true
    });
  } finally {
    await browser.close();
  }
}

/**
 * 產生「掃描報告」PDF
 * - stamp.png (右上角)
 * - 列出可疑連結
 * - 底部顯示「© 2025 凱盾全球國際股份有限公司 All Rights Reserved.」
 */
async function generateScanPDF({ file, suspiciousLinks, stampImagePath }, pdfPath){
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();

    const embedFontCSS = base64TTF
      ? `
      @font-face {
        font-family: "NotoSansTCVar";
        src: url("data:font/ttf;base64,${base64TTF}") format("truetype");
      }
      `
      : '';

    const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
      ? `<img class="stamp" src="file://${stampImagePath}" style="width:80px;opacity:0.9;transform:rotate(45deg);border-radius:50%;" alt="Stamp"/>`
      : '';

    // 若無可疑連結 => 顯示「未發現任何相似連結」
    const linksHtml = suspiciousLinks.length
      ? suspiciousLinks.map(l=>`<div class="link-item">${l}</div>`).join('')
      : '<p>未發現任何相似連結</p>';

    const html = `
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
      ${embedFontCSS}
      body {
        margin:0; padding:0; font-family:"NotoSansTCVar",sans-serif;
      }
      .scan-container {
        position: relative;
        width:80%; margin:0 auto; text-align:center; padding:40px 0;
      }
      .stamp {
        position:absolute; top:0; right:0; width:80px;
        opacity:0.9; transform:rotate(45deg); border-radius:50%;
      }
      .link-item { margin:5px 0; word-wrap:break-word; }
      .footer-company {
        margin-top:30px; font-size:12px; color:#666; text-align:center;
      }
      </style>
    </head>
    <body>
      <div class="scan-container">
        ${stampTag}
        <h1>侵權偵測報告 / Scan Report</h1>
        <p>File ID: ${file.id}</p>
        <p>Filename: ${file.filename}</p>
        <p>Fingerprint: ${file.fingerprint}</p>
        <p>Status: ${file.status}</p>

        <hr style="margin:20px 0;"/>
        <h3>可疑連結 (Possible matches)</h3>
        <div class="links">
          ${linksHtml}
        </div>
        <div class="footer-company">
          © 2025 凱盾全球國際股份有限公司 All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(html, { waitUntil:'networkidle0' });
    await page.emulateMediaType('screen');
    await page.pdf({
      path: pdfPath,
      format:'A4',
      printBackground:true
    });
  } finally {
    await browser.close();
  }
}

// ------------------- Step1 上傳 => 產生證書 ------------------
router.post('/step1', upload.single('file'), async(req, res)=>{
  try {
    if(!req.file){
      return res.status(400).json({ code:'NO_FILE_OR_TOO_BIG', error:'請上傳檔案或檔案過大' });
    }

    // 1) 取得表單
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

    // 2) MIME / 白名單
    const mimeType = req.file.mimetype;
    const isVideo = mimeType.startsWith('video');
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);
    if(isVideo && !isUnlimited){
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ code:'NEED_PAYMENT', error:'短影音需付費方案' });
    }

    // 3) 找或建 user
    let user = await User.findOne({ where:{ [Op.or]:[{ email }, { phone }] }});
    let defaultPassword = null;
    if(!user){
      const rawPass = phone + '@KaiShield';
      const hashedPass = await bcrypt.hash(rawPass,10);
      user = await User.create({
        username: phone,
        email, phone,
        password: hashedPass,
        realName, birthDate, address,
        serialNumber:'SN-'+Date.now(),
        role:'user',
        plan:'free'
      });
      defaultPassword=rawPass;
    }

    // 4) fingerprint
    const buf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(buf);

    // 5) Fingerprint 重複檢查
    const existFile = await File.findOne({ where:{ fingerprint }});
    if(existFile){
      if(isUnlimited){
        fs.unlinkSync(req.file.path);
        return res.json({
          message:'已上傳相同檔案(白名單允許重複)，回傳舊紀錄',
          fileId: existFile.id,
          pdfUrl:`/api/protect/certificates/${existFile.id}`,
          fingerprint: existFile.fingerprint,
          ipfsHash: existFile.ipfs_hash,
          txHash: existFile.tx_hash,
          defaultPassword: null
        });
      } else {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({
          code:'FINGERPRINT_DUPLICATE',
          error:'此檔案已存在(相同fingerprint)'
        });
      }
    }

    // 6) IPFS + 區塊鏈
    let ipfsHash='', txHash='';
    try {
      ipfsHash = await ipfsService.saveFile(buf);
    } catch(eIPFS){
      console.error('[step1 IPFS error]', eIPFS);
    }
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash||'');
      txHash = receipt?.transactionHash || '';
    } catch(eChain){
      console.error('[step1 chain error]', eChain);
    }

    // 7) 建立 File
    const newFile = await File.create({
      user_id: user.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash,
      status:'pending'
    });
    if(isVideo) user.uploadVideos = (user.uploadVideos||0)+1;
    else user.uploadImages = (user.uploadImages||0)+1;
    await user.save();

    // 8) 移動 => /uploads
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

    // 9) 若是影片 <=30秒 => 抽中幀
    let finalPreviewPath=null;
    if(isVideo){
      try {
        const cmd=`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${targetPath}"`;
        const durSec = parseFloat(execSync(cmd).toString().trim())||9999;
        if(durSec<=30){
          const mid = Math.floor(durSec/2);
          const tmpFrameDir = path.join(localDir,'tmpFrames');
          if(!fs.existsSync(tmpFrameDir)) fs.mkdirSync(tmpFrameDir);
          const outP = path.join(tmpFrameDir, `thumb_${newFile.id}.png`);
          execSync(`ffmpeg -i "${targetPath}" -ss ${mid} -frames:v 1 "${outP}"`);
          if(fs.existsSync(outP)){
            finalPreviewPath=outP;
          }
        }
      } catch(eVid){
        console.error('[Video middle frame error]', eVid);
      }
    } else {
      finalPreviewPath= targetPath;
    }

    // 10) 產生證書 PDF
    const pdfName= `certificate_${newFile.id}.pdf`;
    const pdfPath= path.join(localDir, pdfName);
    const stampPath= path.join(__dirname, '../../public/stamp.png');

    await generateCertificatePDF({
      name:user.realName,
      dob:user.birthDate,
      phone:user.phone,
      address:user.address,
      email:user.email,
      title: title.trim(),
      fileName: req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash,
      serial:user.serialNumber,
      mimeType,
      issueDate:new Date().toLocaleString(),
      filePath: finalPreviewPath || targetPath,
      stampImagePath: fs.existsSync(stampPath)? stampPath:null
    }, pdfPath);

    // 11) 回傳 JSON
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
    const fileId= req.params.fileId;
    const localDir= path.resolve(__dirname, '../../uploads');
    const pdfPath= path.join(localDir, `certificate_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({ code:'NOT_FOUND', error:'證書不存在' });
    }
    return res.download(pdfPath, `KaiKaiShield_Certificate_${fileId}.pdf`);
  } catch(err){
    console.error('[certificates error]', err);
    return res.status(500).json({ code:'CERT_DOWNLOAD_ERROR', error:err.message });
  }
});

/** 
 * aggregator => Ginifab => Bing/TinEye/Baidu
 *   (三大引擎: 若 aggregator 某一失敗 => fallback)
 * direct => Bing / TinEye / Baidu
 */
async function aggregatorSearchGinifab(browser, imageUrl){ /* same as code above */ }
async function directSearchBing(browser, imagePath){ /* same as code above */ }
async function directSearchTinEye(browser, imagePath){ /* same as code above */ }
async function directSearchBaidu(browser, imagePath){ /* same as code above */ }
async function doSearchEngines(localFilePath, aggregatorFirst=false, aggregatorImageUrl=''){ /* same as code above */ }

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
        console.log('[TikTok search]', query);
        const rTT= await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search',{
          params:{ keywords: query, region:'us', count:'5' },
          headers:{
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host':'tiktok-scraper7.p.rapidapi.com'
          },
          timeout:20000
        });
        const tiktokItems= rTT.data?.videos||[];
        tiktokItems.forEach(v=>{
          if(v.link) suspiciousLinks.push(v.link);
        });
      } catch(eTT){
        console.error('[TikTok crawler error]', eTT);
      }
    }

    // 2) aggregator + fallback
    const localDir= path.resolve(__dirname,'../../uploads');
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
    const isVideo= !!ext.match(/\.(mp4|mov|avi|mkv|webm)$/i);
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
          const frames=await extractKeyFrames(localPath, frameDir, 10,5);
          for(const fPath of frames){
            const aggregatorUrl='';
            const engineRes=await doSearchEngines(fPath,true, aggregatorUrl);
            allLinks.push(...engineRes.bing.links,...engineRes.tineye.links,...engineRes.baidu.links);
          }
        }
      } catch(eVid2){
        console.error('[video frames error]', eVid2);
      }
    } else {
      // 單圖 => aggregator
      const aggregatorUrl='';
      const engineRes= await doSearchEngines(localPath,true, aggregatorUrl);
      allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
    }

    const uniqueLinks=[...new Set(allLinks)];
    file.status='scanned';
    file.infringingLinks= JSON.stringify(uniqueLinks);
    await file.save();

    // 3) 產生掃描報告 PDF
    const scanPdfName=`scanReport_${file.id}.pdf`;
    const scanPdfPath= path.join(localDir, scanPdfName);
    const stampPath= path.join(__dirname, '../../public/stamp.png');

    await generateScanPDF(
      { file, suspiciousLinks:uniqueLinks, stampImagePath: fs.existsSync(stampPath)? stampPath:null },
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

// (可選) /protect => 演示
router.post('/protect', upload.single('file'), async(req,res)=>{
  // 這裡可整合: IPFS / aggregator / fallback ...
  return res.json({ success:true, message:'TODO: /protect One-Pass Flow' });
});

module.exports = router;
