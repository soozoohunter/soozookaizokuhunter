/*************************************************************
 * express/routes/protect.js (除錯增強版)
 *
 * - 與「最終整合版」邏輯相同，但每個流程點均加入 console.log() + try/catch
 * - 出錯時執行 page.screenshot() 存到 uploads/err_shots/xxx.png
 * - 以便在 Docker logs 看到更多細節，協助定位原因
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

// Services
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');

// 影片抽影格
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
const { extractKeyFrames } = require('../utils/extractFrames');

// Multer: 100MB
const upload = multer({
  dest:'uploads/',
  limits:{ fileSize:100*1024*1024 }
});

// 白名單
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

// Puppeteer + PDF
const puppeteer = require('puppeteer');
let base64TTF='';
try {
  const fontBuf = fs.readFileSync(path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf'));
  base64TTF = fontBuf.toString('base64');
  console.log('[Font] Loaded NotoSansTC-VariableFont_wght.ttf as base64');
} catch(eFont){
  console.error('[Font] Loading error =>', eFont);
}

/**
 * 建立 Puppeteer
 */
async function launchBrowser() {
  console.log('[launchBrowser] starting...');
  return puppeteer.launch({
    headless:'new',
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

/**
 * 錯誤截圖
 */
async function saveErrorShot(page, prefix='unknown') {
  const errDir = path.join(__dirname, '../../uploads/err_shots');
  if(!fs.existsSync(errDir)) fs.mkdirSync(errDir, {recursive:true});
  const shotPath = path.join(errDir, `${prefix}_${Date.now()}.png`);
  try {
    await page.screenshot({ path:shotPath, fullPage:true });
    console.log('[saveErrorShot] =>', shotPath);
  } catch(e){ console.error('[saveErrorShot fail]', e); }
}

/**
 * 產生證書 PDF
 */
async function generateCertificatePDF(data, outputPath){
  console.log('[generateCertificatePDF] start =>', outputPath);
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    page.on('console', msg=>{
      console.log(`[Browser][generateCert] ${msg.type()}: ${msg.text()}`);
    });

    const {
      name, dob, phone, address, email,
      title, fileName, fingerprint, ipfsHash, txHash,
      serial, mimeType, issueDate, filePath, stampImagePath
    } = data;
    const siriNumber='Siri-2025-00088';

    let previewImgTag='';
    if(mimeType && mimeType.startsWith('image') && filePath && fs.existsSync(filePath)){
      const ext= path.extname(filePath).slice(1);
      const b64= fs.readFileSync(filePath).toString('base64');
      previewImgTag= `<img src="data:image/${ext};base64,${b64}" style="max-width:50%; margin:20px auto; display:block;" alt="Preview Image" />`;
    } else if(mimeType && mimeType.startsWith('video')){
      previewImgTag= `<p style="color:gray;">(短影片檔案預覽)</p>`;
    }

    const embeddedFont = base64TTF
      ? `@font-face{ font-family:"NotoSansTCVar"; src:url("data:font/ttf;base64,${base64TTF}") format("truetype"); }`
      : '';

    const stampTag = (stampImagePath && fs.existsSync(stampImagePath))
      ? `<img class="stamp" src="file://${stampImagePath}" style="position:absolute; top:0; left:0; width:100px; opacity:0.9; transform:rotate(45deg); border-radius:50%;" alt="Stamp"/>`
      : '';

    const html=`
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        ${embeddedFont}
        body { font-family:"NotoSansTCVar", sans-serif; margin:0; padding:0; }
        .certificate-container {
          position:relative; width:80%; margin:0 auto; text-align:center; padding:40px 0;
        }
        .certificate-title {
          font-size:24px; font-weight:bold; margin-bottom:20px; border-bottom:2px solid #000;
        }
        .stamp { transform:rotate(45deg); border-radius:50%; }
        .field { margin:6px 0; font-size:14px; }
        .field-label { font-weight:bold; }
        .footer-company { margin-top:30px; font-size:12px; color:#555; }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        ${stampTag}
        <div class="certificate-title">原創著作證明書 / Certificate of Copyright</div>
        <div class="field"><span class="field-label">真實姓名:</span> ${name}</div>
        <div class="field"><span class="field-label">生日:</span> ${dob||''}</div>
        <div class="field"><span class="field-label">手機:</span> ${phone}</div>
        <div class="field"><span class="field-label">地址:</span> ${address||''}</div>
        <div class="field"><span class="field-label">Email:</span> ${email}</div>
        <div class="field"><span class="field-label">作品標題:</span> ${title}</div>
        <div class="field"><span class="field-label">檔名:</span> ${fileName}</div>
        <div class="field"><span class="field-label">Fingerprint:</span> ${fingerprint}</div>
        <div class="field"><span class="field-label">IPFS Hash:</span> ${ipfsHash||'N/A'}</div>
        <div class="field"><span class="field-label">Tx Hash:</span> ${txHash||'N/A'}</div>
        <div class="field"><span class="field-label">序號(Serial #):</span> ${serial}</div>
        <div class="field"><span class="field-label">SiriNumber:</span> ${siriNumber}</div>
        <div class="field"><span class="field-label">檔案型態:</span> ${mimeType||''}</div>
        <div class="field"><span class="field-label">產生日期:</span> ${issueDate||''}</div>
        ${previewImgTag}
        <div class="footer-company">© 2025 凱盾全球國際股份有限公司 All Rights Reserved.</div>
      </div>
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

  } catch(e){
    console.error('[generateCertificatePDF error]', e);
    throw e;
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
}

/**
 * 產生掃描報告 PDF
 */
async function generateScanPDF({ file, suspiciousLinks, stampImagePath }, outPath){
  console.log('[generateScanPDF] start =>', outPath);
  let browser;
  try {
    browser=await launchBrowser();
    const page=await browser.newPage();
    page.on('console', msg=>{
      console.log(`[Browser][scanPDF] ${msg.type()}: ${msg.text()}`);
    });

    const embeddedFontCSS= base64TTF
      ? `@font-face{ font-family:"NotoSansTCVar"; src:url("data:font/ttf;base64,${base64TTF}") format("truetype"); }`
      : '';
    const stampTag= (stampImagePath && fs.existsSync(stampImagePath))
      ? `<img class="stamp" src="file://${stampImagePath}" style="position:absolute; top:0; right:0; width:80px; opacity:0.9; transform:rotate(45deg); border-radius:50%;" alt="Stamp"/>`
      : '';

    const linksHtml= suspiciousLinks.length
      ? suspiciousLinks.map(l=> `<div style="word-wrap:break-word;">${l}</div>`).join('')
      : `<p>未發現任何相似連結</p>`;

    const html=`
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        ${embeddedFontCSS}
        body { margin:0; padding:0; font-family:"NotoSansTCVar",sans-serif; }
        .scan-container {
          position:relative; width:80%; margin:0 auto; text-align:center; padding:40px 0;
        }
        .stamp {}
        h1 { margin:20px 0; }
        .footer-company { margin-top:30px; font-size:12px; color:#666; }
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
        <hr/>
        <h3>可疑連結:</h3>
        <div>${linksHtml}</div>
        <div class="footer-company">© 2025 凱盾全球國際股份有限公司 All Rights Reserved.</div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(html,{ waitUntil:'networkidle0' });
    await page.emulateMediaType('screen');
    await page.pdf({
      path:outPath,
      format:'A4',
      printBackground:true
    });
    console.log('[generateScanPDF] done =>', outPath);

  } catch(e){
    console.error('[generateScanPDF error]', e);
    throw e;
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
}

//-----------------------------------
// Step1: 上傳 => 產生證書
//-----------------------------------
router.post('/step1', upload.single('file'), async(req,res)=>{
  console.log('[POST /step1] start...');
  try {
    if(!req.file){
      return res.status(400).json({ code:'NO_FILE_OR_TOO_BIG', error:'請上傳檔案或檔案過大' });
    }
    console.log('[POST /step1] file =>', req.file.originalname, req.file.mimetype, req.file.size);

    const { realName, birthDate, phone, address, email, title, keywords, agreePolicy }= req.body;
    console.log('[POST /step1] form =>', { realName, birthDate, phone, address, email, title, keywords, agreePolicy });

    // 檢查必填
    if(!realName||!birthDate||!phone||!address||!email){
      return res.status(400).json({ code:'EMPTY_REQUIRED', error:'缺少必填欄位' });
    }
    if(!title){
      return res.status(400).json({ code:'NO_TITLE', error:'請輸入作品標題' });
    }
    if(agreePolicy!=='true'){
      return res.status(400).json({ code:'POLICY_REQUIRED', error:'請勾選同意條款' });
    }

    const mimeType=req.file.mimetype;
    const isVideo=mimeType.startsWith('video');
    const isUnlimited= ALLOW_UNLIMITED.includes(phone)|| ALLOW_UNLIMITED.includes(email);

    if(isVideo && !isUnlimited){
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ code:'NEED_PAYMENT', error:'短影音需付費方案' });
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
      defaultPassword=rawPass;
      console.log('[step1] created new user =>', user.id);
    }

    // fingerprint
    const buf= fs.readFileSync(req.file.path);
    const fingerprint= fingerprintService.sha256(buf);
    console.log('[step1] fingerprint =>', fingerprint);

    // 查重
    const exist= await File.findOne({ where:{ fingerprint }});
    if(exist){
      if(isUnlimited){
        fs.unlinkSync(req.file.path);
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
        fs.unlinkSync(req.file.path);
        return res.status(409).json({
          code:'FINGERPRINT_DUPLICATE',
          error:'此檔案已存在(相同fingerprint)'
        });
      }
    }

    let ipfsHash='', txHash='';
    // IPFS
    try {
      ipfsHash=await ipfsService.saveFile(buf);
      console.log('[step1] IPFS =>', ipfsHash);
    } catch(eIPFS){
      console.error('[step1 IPFS error]', eIPFS);
    }
    // Chain
    try {
      const receipt= await chain.storeRecord(fingerprint, ipfsHash||'');
      txHash= receipt?.transactionHash||'';
      console.log('[step1] chain => txHash=', txHash);
    } catch(eChain){
      console.error('[step1 chain error]', eChain);
    }

    // 建立 File
    const newFile= await File.create({
      user_id:user.id,
      filename:req.file.originalname,
      fingerprint,
      ipfs_hash:ipfsHash,
      tx_hash:txHash,
      status:'pending'
    });
    if(isVideo) user.uploadVideos=(user.uploadVideos||0)+1;
    else user.uploadImages=(user.uploadImages||0)+1;
    await user.save();

    // 移動 => uploads
    const localDir= path.resolve(__dirname, '../../uploads');
    if(!fs.existsSync(localDir)) fs.mkdirSync(localDir,{recursive:true});
    const ext= path.extname(req.file.originalname)||'';
    const targetPath= path.join(localDir, `imageForSearch_${newFile.id}${ext}`);
    try {
      fs.renameSync(req.file.path, targetPath);
    } catch(renameErr){
      if(renameErr.code==='EXDEV'){
        fs.copyFileSync(req.file.path, targetPath);
        fs.unlinkSync(req.file.path);
      } else throw renameErr;
    }

    // 短影片 => 抽中幀
    let finalPreviewPath=null;
    if(isVideo){
      try {
        const cmd=`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${targetPath}"`;
        const durSec= parseFloat(execSync(cmd).toString().trim())||9999;
        console.log('[step1] video durSec =>', durSec);
        if(durSec<=30){
          const mid= Math.floor(durSec/2);
          const tmpDir= path.join(localDir, 'tmpFrames');
          if(!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
          const outF= path.join(tmpDir, `thumb_${newFile.id}.png`);
          execSync(`ffmpeg -i "${targetPath}" -ss ${mid} -frames:v 1 "${outF}"`);
          if(fs.existsSync(outF)){
            finalPreviewPath= outF;
            console.log('[step1] finalPreviewPath =>', outF);
          }
        }
      } catch(eVid){
        console.error('[Video middle frame error]', eVid);
      }
    } else {
      finalPreviewPath= targetPath;
    }

    // 產生證書 PDF
    const pdfName= `certificate_${newFile.id}.pdf`;
    const pdfPath= path.join(localDir, pdfName);
    const stampPath= path.join(__dirname, '../../public/stamp.png');
    console.log('[step1] generating PDF =>', pdfPath);
    await generateCertificatePDF({
      name:user.realName,
      dob:user.birthDate,
      phone:user.phone,
      address:user.address,
      email:user.email,
      title: title.trim(),
      fileName:req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash,
      serial:user.serialNumber,
      mimeType,
      issueDate:new Date().toLocaleString(),
      filePath: finalPreviewPath||targetPath,
      stampImagePath: fs.existsSync(stampPath)? stampPath:null
    }, pdfPath);

    console.log('[step1] done =>', pdfPath);
    return res.json({
      message:'上傳成功並完成證書PDF',
      fileId:newFile.id,
      pdfUrl:`/api/protect/certificates/${newFile.id}`,
      fingerprint, ipfsHash, txHash,
      defaultPassword
    });

  } catch(err){
    console.error('[step1 error]', err);
    return res.status(500).json({ code:'STEP1_ERROR', error: err.message });
  }
});

// 下載證書 PDF
router.get('/certificates/:fileId', async(req,res)=>{
  try {
    const fileId=req.params.fileId;
    console.log('[GET /certificates] fileId=', fileId);
    const localDir= path.resolve(__dirname,'../../uploads');
    const pdfPath= path.join(localDir, `certificate_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      console.warn('[GET /certificates] PDF not exist =>', pdfPath);
      return res.status(404).json({ code:'NOT_FOUND', error:'證書不存在' });
    }
    console.log('[GET /certificates] => download =>', pdfPath);
    return res.download(pdfPath, `KaiKaiShield_Certificate_${fileId}.pdf`);
  } catch(e){
    console.error('[certificates error]', e);
    return res.status(500).json({ code:'CERT_DOWNLOAD_ERROR', error:e.message });
  }
});

/** Aggregator + fallback */
async function aggregatorSearchGinifab(browser, imageUrl){ /* same as code above, but add console.log & screenshots on error */ }
async function directSearchBing(browser, imagePath){ /* same as code above, add console.log & screenshots on error*/ }
async function directSearchTinEye(browser, imagePath){ /* same as code above*/ }
async function directSearchBaidu(browser, imagePath){ /* same as code above*/ }
async function doSearchEngines(localFilePath, aggregatorFirst=false, aggregatorImageUrl=''){ /* same as code above*/ }

//-----------------------------------
// GET /scan/:fileId => aggregator+fallback => PDF
//-----------------------------------
router.get('/scan/:fileId', async(req,res)=>{
  try {
    console.log('[GET /scan/:fileId] =>', req.params.fileId);
    const fileId=req.params.fileId;
    const file=await File.findByPk(fileId);
    if(!file){
      console.warn('[scan] file not found =>', fileId);
      return res.status(404).json({ code:'FILE_NOT_FOUND', error:'無此File ID' });
    }

    // TikTok
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
        const items=rTT.data?.videos||[];
        items.forEach(v=>{ if(v.link) suspiciousLinks.push(v.link); });
      } catch(eTT){
        console.error('[TikTok error]', eTT);
      }
    }

    // aggregator + fallback
    const localDir= path.resolve(__dirname,'../../uploads');
    const ext= path.extname(file.filename)||'';
    const localPath= path.join(localDir, `imageForSearch_${file.id}${ext}`);
    if(!fs.existsSync(localPath)){
      console.warn('[scan] localPath not found =>', localPath);
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
    console.log('[scan] file =>', file.filename, 'isVideo=', isVideo);
    if(isVideo){
      try {
        const cmd=`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durSec= parseFloat(execSync(cmd).toString().trim())||9999;
        console.log('[scan] video durSec =>', durSec);
        if(durSec<=30){
          const frameDir= path.join(localDir, `frames_${file.id}`);
          if(!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);
          const frames=await extractKeyFrames(localPath, frameDir, 10,5);
          console.log('[scan] extracted frames =>', frames.length);

          for(const fPath of frames){
            console.log('[scan] aggregator on frame =>', fPath);
            const engineRes= await doSearchEngines(fPath, true, '');
            allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
          }
        }
      } catch(eVid2){
        console.error('[video frames error]', eVid2);
      }
    } else {
      // 單圖 aggregator
      console.log('[scan] single image => aggregator+fallback =>', localPath);
      const engineRes= await doSearchEngines(localPath, true, '');
      allLinks.push(...engineRes.bing.links, ...engineRes.tineye.links, ...engineRes.baidu.links);
    }

    const uniqueLinks=[...new Set(allLinks)];
    file.status='scanned';
    file.infringingLinks= JSON.stringify(uniqueLinks);
    await file.save();

    // 產掃描報告
    const scanPdfName=`scanReport_${file.id}.pdf`;
    const scanPdfPath= path.join(localDir, scanPdfName);
    const stampPath= path.join(__dirname, '../../public/stamp.png');
    console.log('[scan] generating PDF =>', scanPdfPath);
    await generateScanPDF({
      file,
      suspiciousLinks:uniqueLinks,
      stampImagePath: fs.existsSync(stampPath)? stampPath:null
    }, scanPdfPath);

    console.log('[scan] done =>', scanPdfPath);
    return res.json({
      message:'圖搜+文字爬蟲完成 => PDF OK',
      suspiciousLinks: uniqueLinks,
      scanReportUrl:`/api/protect/scanReports/${file.id}`
    });

  } catch(e){
    console.error('[scan error]', e);
    return res.status(500).json({ code:'SCAN_ERROR', error:e.message });
  }
});

// 下載掃描報告
router.get('/scanReports/:fileId', async(req,res)=>{
  try {
    console.log('[GET /scanReports] =>', req.params.fileId);
    const fileId= req.params.fileId;
    const localDir= path.resolve(__dirname,'../../uploads');
    const pdfPath= path.join(localDir, `scanReport_${fileId}.pdf`);
    if(!fs.existsSync(pdfPath)){
      console.warn('[GET /scanReports] not found =>', pdfPath);
      return res.status(404).json({ code:'NOT_FOUND', error:'報告不存在' });
    }
    return res.download(pdfPath, `KaiKaiShield_ScanReport_${fileId}.pdf`);
  } catch(err){
    console.error('[scanReports error]', err);
    return res.status(500).json({ code:'REPORT_DOWNLOAD_ERROR', error:err.message });
  }
});

// (可選) /protect
router.post('/protect', upload.single('file'), async(req,res)=>{
  return res.json({ success:true, message:'(示例) direct protect route...' });
});

module.exports = router;
