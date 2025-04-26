/*************************************************************
 * express/routes/protect.js
 * 主要改動：
 *   1) PDF 證明書 (generatePdf) 支援插入圖片/影片截圖
 *   2) 圖搜呼叫 doMultiReverseImage 時可確定會產生 debug 截圖
 *   3) 文字置中、底線改為黑色等需求
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

// Multer 上傳限制 (100MB)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }
});

// 白名單 (免付費 / 允許重複 Fingerprint)
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

/**
 * POST /api/protect/step1
 * - 上傳檔案 + 新/舊用戶 + Fingerprint + IPFS + 區塊鏈 + 產 PDF
 * - fingerprint 重複：白名單可複用舊檔；非白名單報錯
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 'NO_FILE_OR_TOO_BIG',
        error: '請上傳檔案或檔案過大'
      });
    }

    // 取得表單資訊
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

    // 必填檢查
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

    // 判斷是否需付費
    const mimeType = req.file.mimetype;
    const isVideo = mimeType.startsWith('video');
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);
    if (isVideo && !isUnlimited) {
      fs.unlinkSync(req.file.path);
      return res.status(402).json({
        code: 'NEED_PAYMENT',
        error: '短影音上傳需付費，請聯繫客服或升級付費方案'
      });
    }

    // 找/建用戶
    let finalUser = null;
    const oldUser = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
    if (oldUser) {
      finalUser = oldUser;
    } else {
      // 建新用戶
      const rawPass = phone + '@KaiShield';
      const hashedPass = await bcrypt.hash(rawPass, 10);

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

    // Fingerprint
    const fileBuf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(fileBuf);

    // 檢查是否已有相同 Fingerprint
    const existFile = await File.findOne({ where: { fingerprint } });
    if (existFile) {
      // 白名單 => 回傳舊紀錄
      if (isUnlimited) {
        fs.unlinkSync(req.file.path);
        return res.json({
          message: '相同檔案已上傳過(白名單允許重複)，回傳原紀錄',
          fileId: existFile.id,
          pdfUrl: `/api/protect/certificates/${existFile.id}`,
          fingerprint: existFile.fingerprint,
          ipfsHash: existFile.ipfs_hash,
          txHash: existFile.tx_hash,
          defaultPassword: null
        });
      } else {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({
          code: 'FINGERPRINT_DUPLICATE',
          error: '已上傳過相同檔案(相同SHA-256)，請勿重複上傳'
        });
      }
    }

    // IPFS & 區塊鏈
    let ipfsHash = null;
    let txHash = null;
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch (eIPFS) {
      console.error('[IPFS error]', eIPFS);
    }
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt?.transactionHash || null;
    } catch (eChain) {
      console.error('[Chain error]', eChain);
    }

    // 建立 File 紀錄
    const newFile = await File.create({
      user_id: finalUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash,
      status: 'pending'
    });
    if (isVideo) finalUser.uploadVideos++;
    else finalUser.uploadImages++;
    await finalUser.save();

    // 移動檔案 => /uploads/
    const ext = path.extname(req.file.originalname) || '';
    const localDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const targetPath = path.join(localDir, `imageForSearch_${newFile.id}${ext}`);
    fs.renameSync(req.file.path, targetPath);

    // 準備插圖(若是圖片或短影片)
    let embedImagePath = null;
    if (isVideo) {
      try {
        // 先測影片長度
        const cmdProbe =
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${targetPath}"`;
        const durSec = parseFloat(execSync(cmdProbe).toString().trim()) || 9999;

        if (durSec <= 30) {
          // 抽第一張關鍵幀
          const frameDir = path.join(localDir, `frames_${newFile.id}`);
          if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);

          const ffCmd = `ffmpeg -i "${targetPath}" -ss 00:00:01 -frames:v 1 "${frameDir}/thumb_1.jpg"`;
          execSync(ffCmd);
          embedImagePath = path.join(frameDir, 'thumb_1.jpg');
          if (!fs.existsSync(embedImagePath)) {
            embedImagePath = null;
          }
        }
      } catch (errVid) {
        console.error('[Video extract error]', errVid);
      }
    } else {
      // 單純圖片
      embedImagePath = targetPath;
    }

    // 產 PDF (文字置中 + 黑色底線 + 可插入縮圖)
    const pdfBuf = await generatePdf({
      realName: finalUser.realName,
      birthDate: finalUser.birthDate,
      phone: finalUser.phone,
      address: finalUser.address,
      email: finalUser.email,
      title: title.trim(),
      filename: req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash,
      serialNumber: finalUser.serialNumber,
      fileBuffer: fileBuf,
      mimeType,
      embedImagePath
    });
    const pdfFileName = `certificate_${newFile.id}.pdf`;
    const pdfFilePath = path.join(localDir, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuf);

    // 新建帳號 => 回傳預設密碼；舊帳號 => null
    const defaultPassword = oldUser ? null : (phone + '@KaiShield');

    return res.json({
      message: '上傳成功並完成 PDF！',
      fileId: newFile.id,
      pdfUrl: `/api/protect/certificates/${newFile.id}`,
      fingerprint,
      ipfsHash,
      txHash,
      defaultPassword
    });

  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'FILE_TOO_LARGE',
        error: '檔案過大，請壓縮或縮小再上傳'
      });
    }
    console.error('[protect step1 error]', err);
    return res.status(500).json({
      code: 'STEP1_ERROR',
      error: err.message || '上傳時發生未知錯誤'
    });
  }
});

/**
 * GET /api/protect/certificates/:fileId
 * - 提供下載 PDF 證書
 */
router.get('/certificates/:fileId', async (req, res) => {
  try {
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath = path.join(localDir, `certificate_${req.params.fileId}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        code: 'PDF_NOT_FOUND',
        error: 'PDF 證書不存在，可能尚未產生'
      });
    }
    res.download(pdfPath, `KaiKaiShield_Certificate_${req.params.fileId}.pdf`);
  } catch (err) {
    console.error('[Download PDF error]', err);
    return res.status(500).json({
      code: 'DOWNLOAD_ERROR',
      error: err.message || '無法下載 PDF'
    });
  }
});

/**
 * GET /api/protect/scan/:fileId
 * - 執行多引擎搜圖 + 文字爬蟲 (TikTok) + 產出「偵測結果 PDF」
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({
        code: 'FILE_NOT_FOUND',
        error: '找不到此檔案或 FileID'
      });
    }

    let suspiciousLinks = [];
    const apiKey = process.env.RAPIDAPI_KEY;

    // TikTok 文字爬蟲
    if (apiKey) {
      const searchQuery = file.filename || file.fingerprint || 'default';
      try {
        const rTT = await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search', {
          params: { keywords: searchQuery, region: 'us', count: '5' },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
          }
        });
        const tiktokItems = rTT.data?.videos || [];
        tiktokItems.forEach(it => {
          if (it.link) suspiciousLinks.push(it.link);
        });
      } catch (eTT) {
        console.error('[TT crawler error]', eTT.message);
      }
    } else {
      console.warn('[scan] No RAPIDAPI_KEY => 跳過 TikTok 文字搜尋');
    }

    // 圖片 / 影片 => doMultiReverseImage
    const localDir = path.resolve(__dirname, '../../uploads');
    const ext = path.extname(file.filename) || '';
    const localPath = path.join(localDir, `imageForSearch_${file.id}${ext}`);

    // 若檔案不存在
    if (!fs.existsSync(localPath)) {
      file.status = 'scanned';
      file.infringingLinks = JSON.stringify([]);
      await file.save();
      return res.json({
        message: '找不到檔案 => 只做文字爬蟲',
        suspiciousLinks: []
      });
    }

    let allLinks = [...suspiciousLinks];
    const user = await User.findByPk(file.user_id);
    let isVideo = false;
    if (ext.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
      isVideo = true;
    }

    // 若是影片且 <=30秒 => 抽多幀圖搜
    if (isVideo && user && user.uploadVideos > 0) {
      try {
        const cmdProbe =
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durSec = parseFloat(execSync(cmdProbe).toString().trim()) || 9999;
        if (durSec <= 30) {
          const outDir = path.join(localDir, `frames_${file.id}`);
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

          // 抽 10 張關鍵幀
          const frames = await extractKeyFrames(localPath, outDir, 10);
          for (const framePath of frames) {
            const found = await doMultiReverseImage(framePath, file.id);
            allLinks.push(...found);
          }
        }
      } catch (eVid) {
        console.error('[video ext error]', eVid);
      }
    } else if (!isVideo && user && user.uploadImages > 0) {
      // 單張圖片
      const found = await doMultiReverseImage(localPath, file.id);
      allLinks.push(...found);
    }

    const uniqueLinks = [...new Set(allLinks)];
    file.status = 'scanned';
    file.infringingLinks = JSON.stringify(uniqueLinks);
    await file.save();

    // 產 PDF 偵測報告
    const scanPdfBuf = await generateScanReportPDF({
      file,
      suspiciousLinks: uniqueLinks
    });
    const scanPdfName = `scanReport_${file.id}.pdf`;
    const scanPdfPath = path.join(localDir, scanPdfName);
    fs.writeFileSync(scanPdfPath, scanPdfBuf);

    return res.json({
      message: '圖搜 & 文字爬蟲完成，已產生偵測報告 PDF',
      suspiciousLinks: uniqueLinks,
      scanReportUrl: `/api/protect/scanReports/${file.id}`
    });

  } catch (err) {
    console.error('[scan error]', err);
    return res.status(500).json({
      code: 'SCAN_ERROR',
      error: err.message || '掃描時發生未知錯誤'
    });
  }
});

/**
 * GET /api/protect/scanReports/:fileId
 * - 下載 偵測結果 PDF
 */
router.get('/scanReports/:fileId', async (req, res) => {
  try {
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath = path.join(localDir, `scanReport_${req.params.fileId}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        error: '找不到偵測結果 PDF'
      });
    }
    res.download(pdfPath, `KaiKaiShield_ScanReport_${req.params.fileId}.pdf`);
  } catch (err) {
    console.error('[download scan PDF error]', err);
    return res.status(500).json({
      code: 'DOWNLOAD_SCAN_PDF_ERROR',
      error: err.message
    });
  }
});

/**
 * 產生 PDF (置中文字 + 黑色底線 + 可插入圖片/影片幀)
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
  mimeType,
  embedImagePath // <--- 新增
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 字體設定
      const notoTC = '/app/fonts/NotoSansTC-VariableFont_wght.ttf';
      if (fs.existsSync(notoTC)) {
        doc.registerFont('NotoChinese', notoTC);
        doc.font('NotoChinese');
      } else {
        doc.font('Helvetica');
      }

      // 左上印章
      doc.save();
      doc.translate(60, 70);
      doc.rotate(5);
      const stampPath = '/app/public/stamp.png';
      if (fs.existsSync(stampPath)) {
        doc.image(stampPath, 0, 0, { width: 100 });
        doc.fontSize(10).fillColor('red')
          .text(`Siri No: ${serialNumber}`, 5, 50, {
            width: 90, align: 'center'
          });
      }
      doc.restore();

      // 主標題 (置中 + 黑色底線)
      doc.moveDown(1);
      doc.fontSize(18).fillColor('black').text(
        '原創著作證明書 / Certificate of Copyright',
        { align: 'center', underline: true }
      );
      doc.moveDown(2);

      // 若可插入圖片
      if (embedImagePath && fs.existsSync(embedImagePath)) {
        doc.fontSize(12).fillColor('black')
          .text('作品預覽 (Preview)：', { align: 'center' });
        doc.moveDown(1);

        const maxWidth = 250;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const centerX = doc.page.margins.left + (pageWidth - maxWidth)/2;
        doc.image(embedImagePath, centerX, doc.y, { width: maxWidth });
        doc.moveDown(2);
      }

      // 用戶/作品資訊 (文字置中)
      const optCenter = { align: 'center' };
      doc.fontSize(12).fillColor('black');
      doc.text(`真實姓名 (Name): ${realName}`, optCenter);
      doc.text(`生日 (Date of Birth): ${birthDate}`, optCenter);
      doc.text(`手機 (Phone): ${phone}`, optCenter);
      doc.text(`地址 (Address): ${address}`, optCenter);
      doc.text(`Email: ${email}`, optCenter);
      doc.moveDown(1);

      doc.text(`作品標題 (Title): ${title}`, optCenter);
      doc.text(`檔名 (File Name): ${filename}`, optCenter);
      doc.moveDown(1);

      doc.text(`Fingerprint (SHA-256): ${fingerprint}`, optCenter);
      doc.text(`IPFS Hash: ${ipfsHash || 'N/A'}`, optCenter);
      doc.text(`Tx Hash: ${txHash || 'N/A'}`, optCenter);
      doc.text(`序號 (Siri Number): ${serialNumber}`, optCenter);
      doc.moveDown(1);

      doc.text(`檔案型態 (MIME): ${mimeType}`, optCenter);
      doc.text(`產生日期 (Issue Date): ${new Date().toLocaleString()}`, optCenter);
      doc.moveDown(2);

      // 法律聲明 (置中 + 黑色底線)
      doc.fontSize(10).fillColor('black').text(
        '本證書根據國際著作權法及相關規定，具有全球法律效力。' +
        '於台灣境內，依據《著作權法》之保護範圍，本證明同具法律效力。',
        { align: 'center' }
      );
      doc.moveDown(0.5);
      doc.text(
        'This certificate is recognized worldwide under international copyright provisions. ' +
        'In Taiwan, it is enforceable under the local Copyright Act.',
        { align: 'center' }
      );
      doc.moveDown(1);
      doc.fontSize(9).fillColor('gray').text(
        '以上資訊由 Epid Global Int\'l Inc SUZOO IP GUARD 系統自動生成。如有疑問或爭議，請參考當地法律規範。',
        { align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 產生偵測結果 PDF
 */
async function generateScanReportPDF({ file, suspiciousLinks }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 標題置中
      doc.fontSize(18).text('偵測結果報告 / Scan Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`File ID: ${file.id}`, { align: 'center' });
      doc.text(`Filename: ${file.filename}`, { align: 'center' });
      doc.text(`Fingerprint: ${file.fingerprint}`, { align: 'center' });
      doc.text(`Status: ${file.status}`, { align: 'center' });
      doc.moveDown();

      if (suspiciousLinks.length > 0) {
        doc.text('以下為可疑連結 (Possible matches):', { align: 'center' });
        doc.moveDown(1);
        suspiciousLinks.forEach(link => {
          doc.text(link, { indent: 20, align: 'left' });
        });
      } else {
        doc.text('未發現任何相似連結或可疑來源', { align: 'center' });
      }

      doc.moveDown(2);
      doc.fontSize(10).fillColor('gray').text(
        '本報告由 SUZOO IP GUARD 侵權偵測系統自動生成。',
        { align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
