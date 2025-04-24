/*************************************************************
 * express/routes/protect.js
 * - 在建立 User 時，username = phone
 * - 產生 PDF 時，加入「著作權注意事項」與「公司資料 (Epic Global Int’l Inc.)」等美化
 *************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const { User, File } = require('../models');
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');

const upload = multer({ dest: 'uploads/' });

// POST /api/protect/step1
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

    // 建 user (username 用 phone)
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

    // fingerprint => IPFS => chain
    const buf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(buf);

    let ipfsHash = null;
    let txHash = null;
    // IPFS
    try {
      ipfsHash = await ipfsService.saveFile(buf);
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

    // File 記錄
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
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

    // 產生 PDF
    const pdfBuf = await generatePdf({
      realName, birthDate, phone, address, email,
      filename: req.file.originalname,
      fingerprint, ipfsHash, txHash
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

// GET /api/protect/certificates/:fileId
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

// GET /api/protect/scan/:fileId
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'RAPIDAPI_KEY not configured' });
    }

    // 模擬：回傳假連結
    const suspiciousLinks = [
      'https://xxxx.com/infringing-post',
      'https://yyyy.com/watch?v=123abc'
    ];

    file.status = 'scanned';
    file.infringingLinks = JSON.stringify(suspiciousLinks);
    await file.save();

    return res.json({
      message: 'AI Scan done',
      suspiciousLinks
    });
  } catch (err) {
    console.error('[scan error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * generatePdf
 * - 美化後的著作權證書，含公司資訊 + 著作權注意事項
 */
async function generatePdf({
  realName, birthDate, phone, address, email,
  filename, fingerprint, ipfsHash, txHash
}) {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ★ Title: SUZOO IP Guard
      doc.fontSize(20).fillColor('#f97316').font('Helvetica-Bold')
         .text('SUZOO IP Guard - Copyright Certificate', { align: 'center' });
      doc.moveDown(0.5);

      // ★ Subtitle: Epic Global Int’l Inc. / 凱盾全球國際股份有限公司
      doc.fontSize(12).fillColor('#333').font('Helvetica')
         .text('Epic Global Int’l Inc. (Registered in Republic of Seychelles)', { align: 'center' });
      doc.moveDown(1.5);

      // ★ Section: 基本資訊
      doc.fontSize(13).fillColor('#111').font('Helvetica-Bold')
         .text('著作權人 (Holder): ', { continued: true })
         .fillColor('#000').font('Helvetica').text(`${realName || 'N/A'}`);

      doc.fontSize(13).fillColor('#111').font('Helvetica-Bold')
         .text('生日 (Birth Date): ', { continued: true })
         .fillColor('#000').font('Helvetica').text(`${birthDate || 'N/A'}`);

      doc.fontSize(13).fillColor('#111').font('Helvetica-Bold')
         .text('手機/電話 (Phone): ', { continued: true })
         .fillColor('#000').font('Helvetica').text(`${phone || 'N/A'}`);

      doc.fontSize(13).fillColor('#111').font('Helvetica-Bold')
         .text('地址 (Address): ', { continued: true })
         .fillColor('#000').font('Helvetica').text(`${address || 'N/A'}`);

      doc.fontSize(13).fillColor('#111').font('Helvetica-Bold')
         .text('Email: ', { continued: true })
         .fillColor('#000').font('Helvetica').text(`${email || 'N/A'}`);

      doc.moveDown(1);

      // ★ Section: 作品檔案 + 區塊鏈資訊
      doc.fontSize(13).fillColor('#333').font('Helvetica-Bold')
         .text('作品檔案 (Original File): ', { continued: true })
         .fillColor('#444').font('Helvetica')
         .text(filename || 'N/A');

      doc.fontSize(13).fillColor('#333').font('Helvetica-Bold')
         .text('Fingerprint (SHA-256): ', { continued: true })
         .fillColor('#444').font('Helvetica')
         .text(fingerprint || '(None)');

      doc.fontSize(13).fillColor('#333').font('Helvetica-Bold')
         .text('IPFS Hash: ', { continued: true })
         .fillColor('#444').font('Helvetica')
         .text(ipfsHash || '(None)');

      doc.fontSize(13).fillColor('#333').font('Helvetica-Bold')
         .text('Tx Hash: ', { continued: true })
         .fillColor('#444').font('Helvetica')
         .text(txHash || '(None)');

      doc.moveDown(1.2);

      // ★ Separator
      doc.strokeColor('#f97316').lineWidth(2)
         .moveTo(doc.x, doc.y)
         .lineTo(doc.page.width - doc.page.margins.right, doc.y)
         .stroke();
      doc.moveDown(1);

      // ★ 內容：著作權申請表的說明 / 注意事項
      doc.fontSize(10).fillColor('#000').font('Helvetica')
        .text(`【中華保護智慧財產權協會 / 著作權存證登記申請書】`, { align: 'left' })
        .moveDown(0.5)
        .text(`※ 若為職務上之著作，著作財產權歸公司所有，除非契約另有約定 (著作權法第11條)。`, { align: 'left' })
        .moveDown(0.5)
        .text(`※ 若侵害他人著作權，如盜用照片、影印整本書等，恐違反著作權法須負損害賠償責任。`, { align: 'left' })
        .moveDown(0.5)
        .text(`※ 相關案例說明：`, { align: 'left' })
        .list([
          `拍賣網站下載他人商品照片 → 涉及攝影著作侵權，可能被索賠新台幣5萬元以上。`,
          `教授提供概念給學生，程式由學生完成 → 著作權歸
