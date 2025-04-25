/*************************************************************
 * express/routes/protect.js
 * - 建User時 username=phone
 * - PDF產出含影片截圖 (透過 ffmpeg)
 * - /scan/:fileId => 真實爬蟲 (TikTok / IG / FB) + Keywords
 *************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { Op } = require('sequelize');
const { execSync } = require('child_process');

const { User, File } = require('../models');
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const PDFDocument = require('pdfkit');

// 上傳檔案暫存
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/protect/step1
 * 上傳檔案 + 建User(若phone/email不存在) + Fingerprint/IPFS/區塊鏈 + PDF(含截圖)
 * 新增: 接收 "keywords" 欄位
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    const { realName, birthDate, phone, address, email, keywords } = req.body;
    if (!req.file || !realName || !birthDate || !phone || !address || !email) {
      return res.status(400).json({ error: '缺少必填欄位或檔案' });
    }

    // 檢查 phone/email 是否已存在
    const existUser = await User.findOne({
      where: {
        [Op.or]: [{ phone }, { email }]
      }
    });
    if (existUser) {
      return res.status(409).json({ error: '您已是會員，請直接登入' });
    }

    // 建User
    const rawPass = phone + '@KaiShield';
    const hashed = await bcrypt.hash(rawPass, 10);
    const newUser = await User.create({
      username: phone,
      serialNumber: 'SN-' + Date.now(),
      email,
      phone,
      password: hashed,
      realName,
      birthDate,
      address,
      role: 'user',
      plan: 'freeTrial'
    });

    // 讀取檔案 => Fingerprint => IPFS => 區塊鏈
    const fileBuf = fs.readFileSync(req.file.path); // buffer
    const mimeType = req.file.mimetype; // 例如 "video/mp4", "image/png" ...
    const fingerprint = fingerprintService.sha256(fileBuf);

    let ipfsHash = null;
    let txHash = null;

    // IPFS
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch (ipfsErr) {
      console.error('[IPFS error]', ipfsErr);
    }

    // 區塊鏈
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt?.transactionHash || null;
    } catch (chainErr) {
      console.error('[Chain error]', chainErr);
    }

    // File資料表紀錄
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash,
      // ★ 也許要多存 "keywords" (若有對應欄位)
      //   假設您 data model 有 "keywords" 欄位可存:
      // keywords,
    });

    // 更新上傳次數
    if (mimeType.startsWith('video')) {
      newUser.uploadVideos++;
    } else if (mimeType.startsWith('image')) {
      newUser.uploadImages++;
    }
    await newUser.save();

    // 刪除本地暫存檔(原檔)
    fs.unlinkSync(req.file.path);

    // 產 PDF (含截圖)
    const pdfBuf = await generatePdf({
      realName,
      birthDate,
      phone,
      address,
      email,
      filename: req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash,
      serialNumber: newUser.serialNumber,
      fileBuffer: fileBuf,   // 用於做截圖
      mimeType               // 用來判斷是否 video
    });
    const pdfPath = `uploads/certificate_${newFile.id}.pdf`;
    fs.writeFileSync(pdfPath, pdfBuf);

    return res.json({
      message: '上傳成功並建立會員＆PDF！',
      fileId: newFile.id,
      pdfUrl: `/api/protect/certificates/${newFile.id}`,
      fingerprint,
      ipfsHash,
      txHash
    });
  } catch (err) {
    console.error('[protect step1 error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/protect/certificates/:fileId
 * 下載 PDF
 */
router.get('/certificates/:fileId', async (req, res) => {
  try {
    const pdfPath = `uploads/certificate_${req.params.fileId}.pdf`;
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF Not Found' });
    }
    res.download(pdfPath, `KaiKaiShield_Certificate_${req.params.fileId}.pdf`);
  } catch (err) {
    console.error('[Download PDF error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/protect/scan/:fileId
 * 真實爬蟲 (TikTok / IG / FB) -> suspiciousLinks
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // ex: 用 filename / fingerprint 當搜尋關鍵字 (僅示範)
    const searchQuery = file.filename || file.fingerprint || 'default';
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'RAPIDAPI_KEY not configured in .env' });
    }

    let suspiciousLinks = [];

    // 1) TikTok
    try {
      const respTikTok = await axios.get(
        'https://tiktok-scraper7.p.rapidapi.com/feed/search',
        {
          params: {
            keywords: searchQuery,
            region: 'us',
            count: '5'
          },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
          }
        }
      );
      const tiktokItems = respTikTok.data?.videos || [];
      tiktokItems.forEach((item) => {
        if (item.link) suspiciousLinks.push(item.link);
      });
    } catch (err) {
      console.error('[TikTok error]', err.message);
    }

    // 2) Instagram
    try {
      const igResp = await axios.get(
        'https://real-time-instagram-scraper-api.p.rapidapi.com/v1/reels_by_keyword',
        {
          params: { query: searchQuery },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'real-time-instagram-scraper-api.p.rapidapi.com'
          }
        }
      );
      const igLinks = igResp.data?.results || [];
      suspiciousLinks = suspiciousLinks.concat(igLinks);
    } catch (errIG) {
      console.error('[IG API error]', errIG.message);
    }

    // 3) Facebook
    try {
      const fbResp = await axios.get(
        'https://facebook-scraper3.p.rapidapi.com/page/reels',
        {
          params: { page_id: '100064860875397' },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com'
          }
        }
      );
      const fbLinks = fbResp.data?.reels || [];
      suspiciousLinks = suspiciousLinks.concat(fbLinks);
    } catch (errFB) {
      console.error('[FB API error]', errFB.message);
    }

    const uniqueLinks = Array.from(new Set(suspiciousLinks));
    file.status = 'scanned';
    file.infringingLinks = JSON.stringify(uniqueLinks);
    await file.save();

    return res.json({
      message: 'AI real scan done via RapidAPI calls',
      suspiciousLinks: uniqueLinks
    });
  } catch (err) {
    console.error('[scan error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * generatePdf(...) - 產出 PDF + 如果是影片就用 ffmpeg 抽圖插入
 */
async function generatePdf({
  realName, birthDate, phone, address, email,
  filename, fingerprint, ipfsHash, txHash,
  serialNumber,
  fileBuffer,   // 新增: 用來做影片截圖
  mimeType      // 新增: 判斷是否 video
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ★ 指定字型檔路徑 (確保 /app/fonts/... 已複製到容器)
      const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
      doc.font(fontPath);

      // 插入 Logo
      try {
        doc.image('/app/frontend/public/logo0.jpg', {
          fit: [80, 80],
          align: 'center',
          valign: 'top'
        });
        doc.moveDown(1);
      } catch (imgErr) {
        console.warn('Logo image load error:', imgErr);
      }

      // 主標題
      doc
        .fontSize(16)
        .fillColor('#f97316')
        .text('Certificate of Copyright Registration', {
          align: 'center',
          underline: true
        });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#444').text('(著作權登記證明書)', { align: 'center' });
      doc.moveDown(1.5);

      // 分隔線
      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#f97316')
        .lineWidth(2)
        .stroke();

      doc.moveDown(1);

      // SUZOO + SerialNumber
      doc
        .fontSize(10)
        .fillColor('#666')
        .text('Issued by Epic Global Int’I Inc. / SUZOO IP Guard (Seychelles)', {
          align: 'center'
        });
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .fillColor('#999')
        .text(`Certificate Serial No.: ${serialNumber}`, {
          align: 'center'
        });
      doc.moveDown(1);

      // 權利人 / 著作資訊
      doc.fontSize(12).fillColor('#111');
      doc.text(`權利主體(Holder): ${realName}`);
      doc.text(`生日(Birth Date): ${birthDate}`);
      doc.text(`電話(Phone): ${phone}`);
      doc.text(`住址(Address): ${address}`);
      doc.text(`Email: ${email}`);
      doc.moveDown(1);

      // 作品資訊
      doc.text(`Original File: ${filename}`);
      doc.text(`SHA-256 Fingerprint: ${fingerprint}`);
      doc.text(`IPFS Hash: ${ipfsHash || '(None)'}`);
      doc.text(`Blockchain TxHash: ${txHash || '(None)'}`);
      doc.moveDown(1);

      // 預覽截圖 (圖片 or 影片截圖)
      doc.fontSize(11).fillColor('#333')
        .text('Preview Screenshot / 圖片或影片預覽：', { underline: true });
      doc.moveDown(0.5);

      if (mimeType.startsWith('image')) {
        // 直接插入該圖
        const tempPath = path.join(__dirname, `../temp_preview_${Date.now()}.jpg`);
        fs.writeFileSync(tempPath, fileBuffer);
        doc.image(tempPath, { fit: [160, 160] });
        fs.unlinkSync(tempPath);

      } else if (mimeType.startsWith('video')) {
        // ffmpeg 抽格
        try {
          const videoTempPath = path.join(__dirname, `../temp_video_${Date.now()}.mp4`);
          const screenshotPath = path.join(__dirname, `../temp_screenshot_${Date.now()}.jpg`);

          // 寫檔
          fs.writeFileSync(videoTempPath, fileBuffer);

          // ffmpeg 指令
          const cmd = `ffmpeg -i "${videoTempPath}" -ss 00:00:01 -frames:v 1 -y "${screenshotPath}"`;
          execSync(cmd);

          // 插入 PDF
          doc.image(screenshotPath, { fit: [160, 160] });

          // 刪除暫存檔
          fs.unlinkSync(videoTempPath);
          fs.unlinkSync(screenshotPath);

        } catch (errShot) {
          console.error('[FFmpeg screenshot error]', errShot);
          doc.text('(Video screenshot failed or ffmpeg not installed)', { italic: true });
        }

      } else {
        // 非圖/視訊 => PDF, docx ...
        doc.text('No preview available for this file type.', { italic: true });
      }

      doc.moveDown(1);

      // 法規 / 聲明
      doc.fontSize(10).fillColor('#444')
        .text(`Our service is recognized under Berne Convention & WTO/TRIPS. This certificate is valid globally, powered by blockchain fingerprint.`, {
          lineGap: 4
        });
      doc.moveDown();
      doc.fontSize(10).fillColor('#888')
        .text('(c) 2023 Epic Global Int’I Inc. / SUZOO IP Guard. All Rights Reserved.', {
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
