/*************************************************************
 * express/routes/protect.js
 * - 建User時 username=phone
 * - 產PDF (中英雙語)
 * - 影片抽圖 (ffmpeg)
 * - /scan/:fileId => 真實爬蟲
 * - 移除隱私權內容於 PDF，僅檢查前端 agreePolicy
 *************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { execSync } = require('child_process');
const { Op } = require('sequelize');

const { User, File } = require('../models');
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');
const PDFDocument = require('pdfkit');

// 上傳檔案暫存
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/protect/step1
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
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

    // 1) 必填檢查
    if (!req.file) {
      return res.status(400).json({ error: '缺少上傳檔案' });
    }
    if (!realName || !birthDate || !phone || !address || !email) {
      return res.status(400).json({ error: '缺少必填欄位(個人基本資料)' });
    }
    if (!title) {
      return res.status(400).json({ error: '請輸入作品標題(title)' });
    }
    if (!keywords) {
      return res.status(400).json({ error: '請輸入關鍵字(keywords)' });
    }
    if (agreePolicy !== 'true') {
      return res.status(400).json({ error: '請勾選同意隱私權政策與使用條款' });
    }

    // 2) 檢查是否已存在 User
    const existUser = await User.findOne({
      where: {
        [Op.or]: [{ phone }, { email }]
      }
    });
    if (existUser) {
      return res
        .status(409)
        .json({ error: '此手機或Email已是會員，請直接登入或使用原帳號' });
    }

    // 3) 建立 User => username = phone
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

    // 4) 讀取檔案 => Fingerprint => IPFS => 區塊鏈
    const fileBuf = fs.readFileSync(req.file.path);
    const mimeType = req.file.mimetype;
    const fingerprint = fingerprintService.sha256(fileBuf);

    let ipfsHash = null;
    let txHash = null;

    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch (ipfsErr) {
      console.error('[IPFS error]', ipfsErr);
    }

    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt?.transactionHash || null;
    } catch (chainErr) {
      console.error('[Chain error]', chainErr);
    }

    // 5) File 資料表
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
      // 若DB有欄位可以存 title/keywords，可附加
    });

    // 6) 更新上傳次數
    if (mimeType.startsWith('video')) {
      newUser.uploadVideos++;
    } else if (mimeType.startsWith('image')) {
      newUser.uploadImages++;
    }
    await newUser.save();

    // 刪除暫存
    fs.unlinkSync(req.file.path);

    // 7) 產PDF
    const pdfBuf = await generatePdf({
      realName,
      birthDate,
      phone,
      address,
      email,
      title: title.trim(),
      keywords: keywords.trim(),
      filename: req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash,
      serialNumber: newUser.serialNumber,
      fileBuffer: fileBuf,
      mimeType
    });
    const pdfPath = `uploads/certificate_${newFile.id}.pdf`;
    fs.writeFileSync(pdfPath, pdfBuf);

    return res.json({
      message: '上傳成功並建立會員＆PDF！',
      fileId: newFile.id,
      pdfUrl: `/api/protect/certificates/${newFile.id}`,
      fingerprint,
      ipfsHash,
      txHash,
      defaultPassword: rawPass
    });
  } catch (err) {
    console.error('[protect step1 error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/protect/certificates/:fileId
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
 *  - 真實爬蟲 (TikTok / IG / FB)
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'RAPIDAPI_KEY not configured in .env' });
    }

    // 以 filename / fingerprint 當搜尋關鍵字
    const searchQuery = file.filename || file.fingerprint || 'default';
    let suspiciousLinks = [];

    // (1) Tiktok
    try {
      const respTikTok = await axios.get(
        'https://tiktok-scraper7.p.rapidapi.com/feed/search',
        {
          params: { keywords: searchQuery, region: 'us', count: '5' },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
          }
        }
      );
      const tiktokItems = respTikTok.data?.videos || [];
      tiktokItems.forEach(item => {
        if (item.link) suspiciousLinks.push(item.link);
      });
    } catch (errTik) {
      console.error('[TikTok error]', errTik.message);
    }

    // (2) Instagram
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
      console.error('[IG error]', errIG.message);
    }

    // (3) Facebook
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
 * generatePdf => 不含隱私條款內容
 *  僅包含著作權證書(英中對照) + 影片截圖
 */
async function generatePdf({
  realName, birthDate, phone, address, email,
  title,
  keywords,
  filename, fingerprint, ipfsHash, txHash,
  serialNumber,
  fileBuffer,
  mimeType
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ★ 指定字型檔 (請確認 fonts 資料夾內有檔案)
      const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
      doc.font(fontPath);

      // 主標
      doc.fontSize(14).fillColor('#000').text('凱盾全球國際股份有限公司 (Epic Global Int’I Inc.)', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(14).fillColor('#666').text('SUZOO IP Guard', { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(16).fillColor('#f97316')
        .text('著作權存證登記證明書', { align: 'center', underline: true });
      doc.fontSize(10).fillColor('#555')
        .text('(Certificate of Copyright Registration)', { align: 'center' });
      doc.moveDown(1);

      // 分隔線
      doc.moveTo(doc.x, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#666')
        .lineWidth(1)
        .stroke();
      doc.moveDown(1);

      // 權利主體
      doc.fontSize(11).fillColor('#111')
        .text('【權利主體 Holder】', { underline: true });
      doc.text(`• RealName / 姓名: ${realName}`);
      doc.text(`• BirthDate: ${birthDate}`);
      doc.text(`• Phone(帳號): ${phone}`);
      doc.text(`• Address: ${address}`);
      doc.text(`• Email: ${email}`);
      doc.moveDown(1);

      // 著作資訊
      doc.text('【著作資訊 Work Info】', { underline: true });
      doc.text(`• Title(作品標題): ${title}`);
      doc.text(`• Keywords: ${keywords}`);
      doc.text(`• OriginalFile: ${filename}`);
      doc.text(`• SHA256: ${fingerprint}`);
      doc.text(`• IPFS Hash: ${ipfsHash || '(None)'}`);
      doc.text(`• TxHash: ${txHash || '(None)'}`);
      doc.moveDown(1);

      // 截圖 (圖片 or 影片)
      doc.text('【作品截圖 / Screenshot】', { underline: true });
      if (mimeType.startsWith('image')) {
        try {
          const tempImg = path.join(__dirname, `../temp_preview_${Date.now()}.jpg`);
          fs.writeFileSync(tempImg, fileBuffer);
          doc.image(tempImg, { fit: [200, 150] });
          fs.unlinkSync(tempImg);
        } catch (imgErr) {
          doc.text('(插入圖片預覽失敗)', { italic: true });
        }
      } else if (mimeType.startsWith('video')) {
        try {
          const videoTemp = path.join(__dirname, `../temp_video_${Date.now()}.mp4`);
          const shotPath = path.join(__dirname, `../temp_screenshot_${Date.now()}.jpg`);
          fs.writeFileSync(videoTemp, fileBuffer);

          // ffmpeg 指令
          const cmd = `ffmpeg -i "${videoTemp}" -ss 00:00:01 -frames:v 1 -y "${shotPath}"`;
          execSync(cmd);
          doc.image(shotPath, { fit: [200, 150] });

          fs.unlinkSync(videoTemp);
          fs.unlinkSync(shotPath);
        } catch (vidErr) {
          doc.text('(Video screenshot failed)', { italic: true });
        }
      } else {
        doc.text('(No preview for this file type)', { italic: true });
      }
      doc.moveDown(1);

      // 版權宣告 => 著作權法
      doc.fontSize(10).fillColor('#000')
        .text(`下列為部分著作權法摘要，可提供法律依據與保護：`, {
          lineGap: 2,
          underline: true
        });
      doc.moveDown(0.5);

      doc.fontSize(9).fillColor('#111')
        .text(`(示範) 依據伯恩公約、TRIPS 等國際規範，本證書具全球法律效力，並可於訴訟時作為初步舉證...`, {
          lineGap: 1.5
        });
      // ...您可插入更多條文

      doc.moveDown(1);
      doc.fontSize(9).fillColor('#888')
        .text(`(c) 2023 凱盾全球國際股份有限公司 / SUZOO IP Guard. All Rights Reserved.`, {
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
