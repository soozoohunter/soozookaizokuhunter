/*************************************************************
 * express/routes/protect.js
 * - 建 User 時 username = phone
 * - PDF 產出 => 英中雙語 (移除中華智慧財產權協會字樣)
 * - /scan/:fileId => 用 axios + RapidAPI Key 進行真實爬蟲
 *************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { Op } = require('sequelize');

const { User, File } = require('../models');
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');

// 上傳檔案暫存
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/protect/step1
 * 上傳檔案、建立 User(若無重複)、Fingerprint => IPFS => 區塊鏈、產 PDF
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    const { realName, birthDate, phone, address, email } = req.body;
    if (!req.file || !realName || !birthDate || !phone || !address || !email) {
      return res.status(400).json({ error: '缺少必填欄位或檔案' });
    }

    // 檢查 phone / email 是否已存在
    const existUser = await User.findOne({
      where: {
        [Op.or]: [{ phone }, { email }]
      }
    });
    if (existUser) {
      return res.status(409).json({ error: '您已是會員，請直接登入' });
    }

    // 建立用戶 (username=phone)
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
    const fileBuf = fs.readFileSync(req.file.path);
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
      tx_hash: txHash
    });

    // 若是 video，計數 +1；否則 image +1
    if (req.file.mimetype.startsWith('video')) {
      newUser.uploadVideos++;
    } else {
      newUser.uploadImages++;
    }
    await newUser.save();

    // 刪除本地暫存
    fs.unlinkSync(req.file.path);

    // 產 PDF
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
      serialNumber: newUser.serialNumber // ★帶入序號
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
 *  - 用 axios + RapidAPI Key 進行真實IG/FB/YouTube爬蟲
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: 'RAPIDAPI_KEY not configured in .env' });
    }

    let suspiciousLinks = [];

    // (1) Instagram
    try {
      const igResp = await axios.get(
        'https://real-time-instagram-scraper-api.p.rapidapi.com/v1/reels_by_keyword',
        {
          params: { query: file.fingerprint },
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

    // (2) Facebook
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

    // (3) YouTube
    try {
      const ytResp = await axios.get(
        'https://youtube-search6.p.rapidapi.com/search',
        {
          params: { query: file.fingerprint },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'youtube-search6.p.rapidapi.com'
          }
        }
      );
      const ytItems = ytResp.data?.items || [];
      const ytLinks = ytItems.map((i) => i.link);
      suspiciousLinks = suspiciousLinks.concat(ytLinks);
    } catch (errYT) {
      console.error('[YouTube API error]', errYT.message);
    }

    const uniqueLinks = Array.from(new Set(suspiciousLinks));

    file.status = 'scanned';
    file.infringingLinks = JSON.stringify(uniqueLinks);
    await file.save();

    return res.json({
      message: 'AI Scan done via RapidAPI, real calls',
      suspiciousLinks: uniqueLinks
    });
  } catch (err) {
    console.error('[scan error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 產生 PDF (新：英中雙語 + Seychelles / Bern / TRIPS 聲明 + serialNumber)
 */
async function generatePdf({
  realName,
  birthDate,
  phone,
  address,
  email,
  filename,
  fingerprint,
  ipfsHash,
  txHash,
  serialNumber
}) {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ★ 字體 (保證 /app/fonts/NotoSansTC-VariableFont_wght.ttf 存在)
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

      // 主標題：Certificate of Copyright Registration
      doc
        .fontSize(16)
        .fillColor('#f97316')
        .text('Certificate of Copyright Registration', {
          align: 'center',
          underline: true
        });
      doc.moveDown(0.5);

      doc
        .fontSize(12)
        .fillColor('#444')
        .text('(著作權登記證明書)', { align: 'center' });

      doc.moveDown(1.5);

      // 分隔線
      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#f97316')
        .lineWidth(2)
        .stroke();

      doc.moveDown(1);

      // SUZOO + Serial Number
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

      // 權利人資訊 (中英)
      doc.fontSize(12).fillColor('#111');
      doc.text(`權利主體 (Holder) / Author: ${realName}`);
      doc.text(`生日 (Birth Date): ${birthDate}`);
      doc.text(`電話 (Phone): ${phone}`);
      doc.text(`住址 (Address): ${address}`);
      doc.text(`Email: ${email}`);
      doc.moveDown(1);

      // 著作資訊
      doc.text(`Original File: ${filename}`);
      doc.text(`SHA-256 Fingerprint: ${fingerprint}`);
      doc.text(`IPFS Hash: ${ipfsHash || '(None)'}`);
      doc.text(`Blockchain TxHash: ${txHash || '(None)'}`);
      doc.moveDown(1);

      // 法規聲明 (英中)
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(
          `Our digital fingerprint & blockchain registration technology is recognized under the Berne Convention & TRIPS agreement, with global legal enforceability. Being registered in Seychelles (a UN member) ensures the certificate’s international validity.`
        );
      doc.moveDown(0.7);
      doc
        .fontSize(10)
        .fillColor('#555')
        .text(
          `本證書為結合「區塊鏈 + AI」之著作權保護服務，符合伯恩公約 (Berne Convention) 與 WTO / TRIPS 等國際智慧財產權規範，並於非洲塞席爾(Seychelles)註冊，具有全球法域效力。`
        );
      doc.moveDown(1.5);

      // 分隔線
      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#bbb')
        .lineWidth(1)
        .stroke();

      doc.moveDown(1);

      // 結語
      doc
        .fontSize(10)
        .fillColor('#666')
        .text(
          `This Certificate stands as prima facie evidence of copyright authorship. The SHA-256 hash is unique and tamper-proof, verifying the originality and creation time.`
        );
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor('#444')
        .text(
          `本證書作為著作權歸屬初步證據。上述哈希值具唯一性與不可竄改性，有效證明作品之原創性與完成時間。`
        );

      doc.moveDown(1);

      doc
        .fontSize(10)
        .fillColor('#888')
        .text(
          '(c) 2023 Epic Global Int’I Inc. / SUZOO IP Guard. All Rights Reserved.',
          {
            align: 'center'
          }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
