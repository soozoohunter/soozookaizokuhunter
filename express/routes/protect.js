/*************************************************************
 * express/routes/protect.js
 * (改良版：PDF 美化 + 單一字體 NotoSansTC + 45°印章 + 內嵌序號
 *  進階：掃描完成後產「偵測結果 PDF」，含 foundLinks)
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

const PDFDocument = require('pdfkit');

const { User, File } = require('../models');
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const { extractKeyFrames } = require('../utils/extractFrames');

// ★ 引入最終整合版 doMultiReverseImage ★
const { doMultiReverseImage } = require('../utils/multiEngineReverseImage');

// Multer 上傳限制
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }
});

// 白名單 (免付費)
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

/**
 * POST /api/protect/step1
 * - 上傳檔案 + 新用戶(或使用舊用戶) + Fingerprint + IPFS + 區塊鏈 + 產 PDF
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    // 1) 檔案檢查
    if (!req.file) {
      return res.status(400).json({
        code: 'NO_FILE_OR_TOO_BIG',
        error: '請上傳檔案，或檔案過大'
      });
    }

    // 2) 表單檢查
    const {
      realName,
      birthDate,
      phone,
      address,
      email,
      title,
      keywords,
      agreePolicy
    } = req.body;

    if (!realName || !birthDate || !phone || !address || !email) {
      return res.status(400).json({
        code: 'EMPTY_REQUIRED',
        error: '缺少必填欄位(個人資料)'
      });
    }
    if (!title) {
      return res.status(400).json({
        code: 'NO_TITLE',
        error: '請輸入作品標題'
      });
    }
    if (agreePolicy !== 'true') {
      return res.status(400).json({
        code: 'POLICY_REQUIRED',
        error: '請勾選同意隱私權政策與使用條款'
      });
    }

    // 3) 判斷是否需付費
    const mimeType = req.file.mimetype;
    const isVideo  = mimeType.startsWith('video');
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);

    if (isVideo && !isUnlimited) {
      fs.unlinkSync(req.file.path);
      return res.status(402).json({
        code: 'NEED_PAYMENT',
        error: '短影音上傳需付費，請聯繫客服或升級付費方案'
      });
    }

    // 4) 檢查 DB 是否已有此 Email/Phone
    let finalUser = null;
    const oldUser = await User.findOne({
      where:{ [Op.or]: [{ email }, { phone }] }
    });

    if (oldUser) {
      if (!isUnlimited) {
        return res.status(409).json({
          code: 'ALREADY_MEMBER',
          error: '此Email或手機已被使用，請改用已有帳號'
        });
      } else {
        // 白名單 => 可直接使用舊用戶
        finalUser = oldUser;
      }
    } else {
      // 建新用戶
      const rawPass   = phone + '@KaiShield';
      const hashedPass= await bcrypt.hash(rawPass, 10);

      finalUser = await User.create({
        username: phone,
        serialNumber: 'SN-' + Date.now(),
        email,
        phone,
        password: hashedPass,
        realName,
        birthDate,
        address,
        role: 'user',
        plan: 'freeTrial'
      });
    }

    // 5) Fingerprint => IPFS => 區塊鏈
    const fileBuf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(fileBuf);

    let ipfsHash=null, txHash=null;
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch(eIPFS){
      console.error('[IPFS error]', eIPFS);
    }
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt?.transactionHash || null;
    } catch(eChain){
      console.error('[Chain error]', eChain);
    }

    // 6) File紀錄
    const newFile = await File.create({
      user_id: finalUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
    });

    if (isVideo) finalUser.uploadVideos++;
    else finalUser.uploadImages++;
    await finalUser.save();

    // 7) 移動檔案 => /uploads/
    const ext = path.extname(req.file.originalname) || '';
    const localDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(localDir)){
      fs.mkdirSync(localDir, { recursive:true });
    }
    const targetPath = path.join(localDir, `imageForSearch_${newFile.id}${ext}`);
    fs.renameSync(req.file.path, targetPath);

    // 8) 產生 PDF (新版外觀)
    const pdfBuf = await generatePdf({
      realName:  finalUser.realName,
      birthDate: finalUser.birthDate,
      phone:     finalUser.phone,
      address:   finalUser.address,
      email:     finalUser.email,
      title:     title.trim(),
      filename:  req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash,
      serialNumber: finalUser.serialNumber,
      fileBuffer: fileBuf,
      mimeType
    });

    const pdfFileName = `certificate_${newFile.id}.pdf`;
    const pdfFilePath = path.join(localDir, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuf);

    // 9) 新建帳號 -> 回傳預設密碼；舊帳號 -> null
    const defaultPassword = oldUser ? null : (phone + '@KaiShield');

    return res.json({
      message:'上傳成功並完成 PDF！',
      fileId: newFile.id,
      pdfUrl: `/api/protect/certificates/${newFile.id}`,
      fingerprint,
      ipfsHash,
      txHash,
      defaultPassword
    });

  } catch(err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'FILE_TOO_LARGE',
        error: '檔案過大，請壓縮或縮小檔案再上傳'
      });
    }
    console.error('[protect step1 error]', err);
    return res.status(500).json({
      code:'STEP1_ERROR',
      error: err.message || '上傳時發生未知錯誤'
    });
  }
});

/**
 * GET /api/protect/certificates/:fileId
 */
router.get('/certificates/:fileId', async (req, res)=>{
  try {
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath = path.join(localDir, `certificate_${req.params.fileId}.pdf`);

    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({
        code:'PDF_NOT_FOUND',
        error:'PDF 證書不存在，可能尚未產生'
      });
    }
    res.download(pdfPath, `KaiKaiShield_Certificate_${req.params.fileId}.pdf`);
  } catch(err){
    console.error('[Download PDF error]', err);
    return res.status(500).json({
      code:'DOWNLOAD_ERROR',
      error: err.message || '無法下載 PDF'
    });
  }
});

/**
 * GET /api/protect/scan/:fileId
 * - 執行多引擎搜圖 + 文字爬蟲 (TikTok) + 產出「偵測結果 PDF」
 */
router.get('/scan/:fileId', async (req, res)=>{
  try {
    const file = await File.findByPk(req.params.fileId);
    if(!file){
      return res.status(404).json({
        code:'FILE_NOT_FOUND',
        error:'找不到此檔案或 FileID'
      });
    }

    let suspiciousLinks = [];
    const apiKey = process.env.RAPIDAPI_KEY;

    // 文字爬蟲 (範例: TikTok)
    if(apiKey) {
      const searchQuery = file.filename || file.fingerprint || 'default';
      try {
        const rTT = await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search', {
          params:{ keywords: searchQuery, region:'us', count:'5' },
          headers:{
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host':'tiktok-scraper7.p.rapidapi.com'
          }
        });
        const tiktokItems = rTT.data?.videos || [];
        tiktokItems.forEach(it => {
          if(it.link) suspiciousLinks.push(it.link);
        });
      } catch(eTT){
        console.error('[TT crawler error]', eTT.message);
      }
    } else {
      console.warn('[scan] No RAPIDAPI_KEY => skip text-based crawling');
    }

    // 圖片 / 影片 => doMultiReverseImage
    const localDir = path.resolve(__dirname, '../../uploads');
    const ext = path.extname(file.filename) || '';
    const localPath= path.join(localDir, `imageForSearch_${file.id}${ext}`);

    // 若檔案不存在，跳過圖搜
    if(!fs.existsSync(localPath)){
      file.status='scanned';
      file.infringingLinks = JSON.stringify([]);
      await file.save();
      return res.json({
        message:'file not found => only text-based done',
        suspiciousLinks:[]
      });
    }

    let allLinks = [...suspiciousLinks];
    const user = await User.findByPk(file.user_id);

    // 如果是影片，且長度 <= 30 秒，就抽關鍵幀再跑 doMultiReverseImage
    let isVideo = false;
    if(ext.match(/\.(mp4|mov|avi|mkv|webm)$/i)){
      isVideo = true;
    }

    if(isVideo && user && user.uploadVideos>0){
      try {
        const cmdProbe=`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durStr= execSync(cmdProbe).toString().trim();
        const durSec= parseFloat(durStr)||9999;

        if(durSec<=30){
          const outDir = path.join(localDir, `frames_${file.id}`);
          if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);
          const frames= await extractKeyFrames(localPath, outDir, 10);
          for(const framePath of frames){
            const found= await doMultiReverseImage(framePath, file.id);
            allLinks.push(...found);
          }
        }
      } catch(eVid){
        console.error('[video ext error]', eVid);
      }
    }
    else if(!isVideo && user && user.uploadImages>0){
      // 單張圖片 => 直接 doMultiReverseImage
      const found= await doMultiReverseImage(localPath, file.id);
      allLinks.push(...found);
    }

    const uniqueLinks= [...new Set(allLinks)];
    file.status='scanned';
    file.infringingLinks= JSON.stringify(uniqueLinks);
    await file.save();

    // 產生「偵測結果 PDF」(scanReport_xxx.pdf)
    const scanPdfBuf = await generateScanReportPDF({
      file,
      suspiciousLinks: uniqueLinks
    });
    const scanPdfName = `scanReport_${file.id}.pdf`;
    const scanPdfPath = path.join(localDir, scanPdfName);
    fs.writeFileSync(scanPdfPath, scanPdfBuf);

    return res.json({
      message:'Scan done => text + multi-engine => PDF generated',
      suspiciousLinks: uniqueLinks,
      scanReportUrl: `/api/protect/scanReports/${file.id}`
    });

  } catch(err){
    console.error('[scan error]', err);
    return res.status(500).json({
      code:'SCAN_ERROR',
      error: err.message || '掃描時發生未知錯誤'
    });
  }
});

/**
 * GET /api/protect/scanReports/:fileId
 * - 提供下載「偵測結果 PDF」
 */
router.get('/scanReports/:fileId', async (req, res) => {
  try {
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath = path.join(localDir, `scanReport_${req.params.fileId}.pdf`);
    if(!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        code:'NOT_FOUND',
        error:'Scan PDF 不存在'
      });
    }
    res.download(pdfPath, `KaiKaiShield_ScanReport_${req.params.fileId}.pdf`);
  } catch(err) {
    console.error('[download scan PDF error]', err);
    return res.status(500).json({
      code:'DOWNLOAD_SCAN_PDF_ERROR',
      error: err.message
    });
  }
});

/**
 * 產生 PDF（新版排版 + 45度印章 + Siri Number in red）
 */
async function generatePdf({
  realName,
  birthDate,
  phone,
  address,
  email,
  title,
  filename,
  fingerprint,
  ipfsHash,
  txHash,
  serialNumber,
  fileBuffer,
  mimeType
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      // 1) 字體設定
      const notoTC = '/app/fonts/NotoSansTC-VariableFont_wght.ttf';
      if (fs.existsSync(notoTC)) {
        doc.registerFont('NotoChinese', notoTC);
        doc.font('NotoChinese');
      } else {
        console.warn('[generatePdf] 未找到 NotoSansTC，改用 Helvetica');
        doc.font('Helvetica');
      }

      // 2) 主標題 (雙語)
      doc.fontSize(20).text('原創著作證明書 / Certificate of Copyright', {
        align: 'center',
        underline: true
      });

      doc.moveDown(1);

      // 3) 插入印章 & 序號(旋轉 45度)
      doc.moveDown(2);
      const stampPath = '/app/public/stamp.png';
      if (fs.existsSync(stampPath)) {
        doc.save();
        const centerX = doc.page.width / 2;
        const stampY = 150;
        doc.translate(centerX, stampY);
        doc.rotate(45, { origin: [0, 0] });

        const stampWidth = 120;
        doc.image(stampPath, -stampWidth / 2, -30, {
          width: stampWidth
        });

        doc.fontSize(10)
           .fillColor('red')
           .text(`Siri No: ${serialNumber}`, -stampWidth / 2 + 5, 20, {
             width: stampWidth - 10,
             align: 'center'
           });

        doc.restore();
      }
      doc.moveDown(2);

      // 4) 作品/用戶資訊
      doc.fontSize(12);
      doc.text(`真實姓名 (Name): ${realName}`);
      doc.text(`生日 (Date of Birth): ${birthDate}`);
      doc.text(`手機 (Phone): ${phone}`);
      doc.text(`地址 (Address): ${address}`);
      doc.text(`Email: ${email}`);
      doc.moveDown(1);

      doc.text(`作品標題 (Title): ${title}`);
      doc.text(`檔名 (File Name): ${filename}`);
      doc.moveDown(1);

      doc.text(`Fingerprint (SHA-256): ${fingerprint}`);
      doc.text(`IPFS Hash: ${ipfsHash || 'N/A'}`);
      doc.text(`Tx Hash: ${txHash || 'N/A'}`);
      doc.text(`序號 (Siri Number): ${serialNumber}`);
      doc.moveDown(1);

      doc.text(`檔案型態 (MIME): ${mimeType}`);
      doc.text(`產生日期 (Issue Date): ${new Date().toLocaleString()}`);

      // 5) 法律聲明
      doc.moveDown(2);
      doc.fontSize(10).fillColor('black').text(
        '本證書根據國際著作權法及相關規定，具有全球法律效力。' +
        '於台灣境內，依據《著作權法》之保護範圍，本證明同具法律效力。',
        { align: 'justify' }
      );
      doc.moveDown(0.5);
      doc.text(
        'This certificate is recognized worldwide under international copyright provisions. ' +
        'In Taiwan, it is enforceable under the local Copyright Act.',
        { align: 'justify' }
      );

      doc.moveDown(1);
      doc.fontSize(9).fillColor('gray').text(
        '以上資訊由 Epid Global Int\'l Inc SUZOO IP GUARD 系統自動生成。如有任何疑問或爭議，請參考當地法律規範。',
        { align: 'left' }
      );

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 產生「偵測結果 PDF」
 * - (示例) 包含檔案資訊 & suspiciousLinks
 */
async function generateScanReportPDF({ file, suspiciousLinks }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      doc.fontSize(18).text('偵測結果報告 / Scan Report', { align:'center' });
      doc.moveDown();

      doc.fontSize(12).text(`File ID: ${file.id}`);
      doc.text(`Filename: ${file.filename}`);
      doc.text(`Fingerprint: ${file.fingerprint}`);
      doc.text(`Status: ${file.status}`);
      doc.moveDown();

      if(suspiciousLinks.length>0) {
        doc.text(`以下為搜圖/文字爬蟲之可疑連結 (Possible matches):`);
        doc.moveDown(0.5);
        suspiciousLinks.forEach(link => {
          doc.text(link, { indent:20 });
        });
      } else {
        doc.text(`未發現任何相似連結或可疑來源。`, { underline:false });
      }

      doc.moveDown(1);
      doc.fontSize(10).fillColor('gray').text(
        '本報告由 SUZOO IP GUARD 侵權偵測系統自動生成。',
        { align: 'left' }
      );

      doc.end();
    } catch(err) {
      reject(err);
    }
  });
}

module.exports = router;
