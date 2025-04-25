/*************************************************************
 * express/routes/protect.js
 * - 建 User 時 username = phone
 * - PDF 產出時插入「作品縮圖 / 截圖」(若為 image)
 * - /scan/:fileId => 真實爬蟲 (可用 title / keywords)
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

const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/protect/step1
 * 上傳檔案 + 建 User(若phone/email不存在) + Fingerprint/IPFS/區塊鏈 + PDF
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    const { realName, birthDate, phone, address, email, title, keywords } = req.body;
    if (
      !req.file ||
      !realName ||
      !birthDate ||
      !phone ||
      !address ||
      !email ||
      !title ||
      !keywords
    ) {
      return res.status(400).json({ error: '缺少必填欄位或檔案' });
    }

    // 檢查 phone/email 是否重複
    const existUser = await User.findOne({
      where: {
        [Op.or]: [{ phone }, { email }]
      }
    });
    if (existUser) {
      return res.status(409).json({ error: '您已是會員，請直接登入' });
    }

    // 建 User (username=phone)
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

    // Fingerprint => IPFS => 區塊鏈
    const fileBuf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(fileBuf);

    let ipfsHash = null;
    let txHash = null;

    // IPFS
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch (e) {
      console.error('[IPFS error]', e);
    }

    // 區塊鏈
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt?.transactionHash || null;
    } catch (e) {
      console.error('[Chain error]', e);
    }

    // 建 File 記錄
    // 假設 File model 有欄位: title, keywords (string)
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash,
      title,
      keywords
    });

    // 更新上傳次數
    if (req.file.mimetype.startsWith('video')) {
      newUser.uploadVideos++;
    } else {
      newUser.uploadImages++;
    }
    await newUser.save();

    // 刪除暫存檔
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
      serialNumber: newUser.serialNumber,
      fileBuffer: fileBuf,           // 給 generatePdf 用來做縮圖
      mimeType: req.file.mimetype,   // 判斷是否 image
      title,
      keywords
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/protect/scan/:fileId
 * 真實爬蟲 => 可用 File 裡的 title, keywords 做搜尋
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const apiKey = process.env.RAPIDAPI_KEY || '71dbbf39f7msh...'; 
    if (!apiKey) {
      return res.status(400).json({ error: 'RAPIDAPI_KEY not configured in .env' });
    }

    // 拿 file.title / file.keywords => 取用其中一個作為 search query
    // 如果有多個 keyword，用 ; 或 , 分割 => call 多次 API or combine
    let suspiciousLinks = [];

    // 示例：只簡單合併 title + first keyword => search
    let combinedQuery = file.title || '';
    if (file.keywords) {
      const splitted = file.keywords.split(/[,;]+/).map(k => k.trim()).filter(Boolean);
      if (splitted.length > 0) {
        combinedQuery += ' ' + splitted[0]; 
      }
    }
    if (!combinedQuery) {
      combinedQuery = file.filename || file.fingerprint || 'defaultKey';
    }

    // ========== Instagram Scraper Example ==========
    try {
      const igResp = await axios.get(
        'https://real-time-instagram-scraper-api.p.rapidapi.com/v1/reels_by_keyword',
        {
          params: { query: combinedQuery },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'real-time-instagram-scraper-api.p.rapidapi.com'
          }
        }
      );
      const igLinks = igResp.data?.results || [];
      suspiciousLinks = suspiciousLinks.concat(igLinks);
    } catch (errIG) {
      console.error('[IG error]', errIG.message);
    }

    // ========== Facebook Scraper Example ==========
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
      console.error('[FB error]', errFB.message);
    }

    // ========== YouTube (youtube-search6) ==========
    try {
      const ytResp = await axios.get(
        'https://youtube-search6.p.rapidapi.com/search',
        {
          params: { query: combinedQuery },
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
      console.error('[YT error]', errYT.message);
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
 * 產生 PDF，插入小截圖
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
  serialNumber,
  fileBuffer,
  mimeType,
  title,
  keywords
}) {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // 字型
      const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
      doc.font(fontPath);

      // LOGO
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

      // SUZOO + SerialNumber
      doc
        .fontSize(10)
        .fillColor('#666')
        .text('Issued by SUZOO IP Guard (Seychelles)', {
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

      // 權利人 / 作品資訊
      doc.fontSize(12).fillColor('#111');
      doc.text(`【Author Info】`);
      doc.text(`Real Name: ${realName}`);
      doc.text(`Birth Date: ${birthDate}`);
      doc.text(`Phone: ${phone}`);
      doc.text(`Address: ${address}`);
      doc.text(`Email: ${email}`);
      doc.moveDown(0.8);

      doc.text(`【Work Info】`);
      doc.text(`Title: ${title}`);
      doc.text(`Keywords: ${keywords}`);
      doc.text(`File Name: ${filename}`);
      doc.text(`SHA-256 Fingerprint: ${fingerprint}`);
      doc.text(`IPFS Hash: ${ipfsHash || '(None)'}`);
      doc.text(`TxHash: ${txHash || '(None)'}`);
      doc.moveDown(1);

      // 小截圖區
      doc.fontSize(11).fillColor('#333').text('Preview / Screenshot:', { underline: true });
      doc.moveDown(0.5);

      if (mimeType.startsWith('image')) {
        // 試著插入圖片
        try {
          // 先寫 fileBuffer 至暫存 => e.g. "uploads/preview_temp.jpg"
          const tempPath = path.join(__dirname, `../temp_preview_${Date.now()}.jpg`);
          fs.writeFileSync(tempPath, fileBuffer);
          // 插入
          doc.image(tempPath, { fit: [150, 150] });
          // 刪檔
          fs.unlinkSync(tempPath);
        } catch (imgErr2) {
          doc.text('(Image preview error)', { italic: true });
        }
      } else if (mimeType.startsWith('video')) {
        // 若要抽影格，需要 ffmpeg。這裡先簡單示範:
        doc.text('(Video file) Screenshot not implemented.', { italic: true });
      } else {
        doc.text('No preview available.', { italic: true });
      }

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
          `This Certificate serves as preliminary evidence of authorship under Berne Convention & WTO/TRIPS. Uniquely hashed (SHA-256), recorded on blockchain, ensuring authenticity.`
        );
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor('#444')
        .text(
          `本證書符合伯恩公約與 WTO/TRIPS 規範，內含不可竄改之SHA-256指紋及區塊鏈記錄，具法律佐證力。`
        );

      doc.moveDown(1);
      doc
        .fontSize(10)
        .fillColor('#888')
        .text('(c) 2023 SUZOO IP Guard. All Rights Reserved.', {
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
