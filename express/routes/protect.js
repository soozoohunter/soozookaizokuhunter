// express/routes/protect.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// PDFKit
const PDFDocument = require('pdfkit');

// Model
const { User, File } = require('../models');

// IPFS / chain / fingerprint service
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');

// Multer 上傳暫存
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/protect/step1
 * - 檢查 phone/email => 若已存在 => 409
 * - 若無 => 建立 User => hashing password => plan=freeTrial
 * - fingerprint => IPFS => chain => File DB
 * - 生成 PDF => 回傳 pdfUrl
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    const { realName, birthDate, phone, address, email } = req.body;
    if (!req.file || !realName || !birthDate || !phone || !address || !email) {
      return res.status(400).json({ error: '缺少必填欄位或檔案' });
    }

    // 1) 檢查是否已存在
    const existUser = await User.findOne({
      where: {
        [Op.or]: [{ username: phone }, { email }]
      }
    });
    if (existUser) {
      return res.status(409).json({ error: '您已是我們的聯盟一員，請直接登入' });
    }

    // 2) 建立 newUser
    const rawPass = phone + '@KaiShield'; 
    const hashedPassword = await bcrypt.hash(rawPass, 10);

    // serialNumber 可自動產生，如 'SN-' + Date.now() 或其他
    const newUser = await User.create({
      serialNumber: 'SN-' + Date.now(),
      username: phone,
      email,
      password: hashedPassword,
      realName,
      birthDate,
      phone,
      address,
      role: 'user',
      plan: 'freeTrial',
      uploadVideos: 0,
      uploadImages: 0
    });

    // 3) fingerprint => IPFS => chain
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const fingerprint = fingerprintService.sha256(buffer);

    let ipfsHash = null;
    let txHash = null;

    // IPFS
    try {
      ipfsHash = await ipfsService.saveFile(buffer);
    } catch (err) {
      console.error('[IPFS error]', err.message);
    }

    // blockchain
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      if (receipt && receipt.transactionHash) {
        txHash = receipt.transactionHash;
      } else {
        // 如果 chain.storeRecord 只回傳 fake hash
        txHash = receipt || null;
      }
    } catch (err) {
      console.error('[Chain error]', err.message);
    }

    // 建立 File
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
    });

    // 檔案類型
    if (req.file.mimetype.startsWith('video')) {
      newUser.uploadVideos++;
    } else {
      newUser.uploadImages++;
    }
    await newUser.save();

    // 刪除上傳暫存
    fs.unlinkSync(filePath);

    // 4) 生成 PDF
    const pdfBuffer = await generateCopyrightPdf({
      realName,
      birthDate,
      phone,
      address,
      email,
      filename: req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash
    });

    const pdfFilename = `certificate_${newFile.id}.pdf`;
    const pdfPath = `uploads/${pdfFilename}`;
    fs.writeFileSync(pdfPath, pdfBuffer);

    return res.json({
      message: '上傳成功並建立會員＆PDF！',
      fileId: newFile.id,
      fingerprint,
      ipfsHash,
      txHash,
      pdfUrl: `/api/protect/certificates/${newFile.id}`
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
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/protect/scan/:fileId
 * AI爬蟲 => RapidAPI / DMCA
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const fingerprint = file.fingerprint;
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: 'RAPIDAPI_KEY not configured' });
    }

    // 假設呼叫外部API
    // const resp = await axios.get('https://some-rapidapi-endpoint',{
    //   headers: { 'X-RapidAPI-Key': apiKey },
    //   params: { hash: fingerprint }
    // });
    // const suspiciousLinks = resp.data.links || [];

    // Mock Data
    const suspiciousLinks = [
      'https://fb.com/someInfringerPost',
      'https://y2u.be/infringingVid'
    ];

    return res.json({
      message: 'AI Scan done',
      fileId,
      fingerprint,
      suspiciousLinks
    });
  } catch (err) {
    console.error('[scan error]', err);
    res.status(500).json({ error: err.message });
  }
});

// 生成 PDF 函式
async function generateCopyrightPdf({
  realName, birthDate, phone, address, email,
  filename, fingerprint, ipfsHash, txHash
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // 標題
      doc.fontSize(18).fillColor('#f97316')
        .text('KaiKaiShield / SUZOO IP Guard', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor('#333')
        .text('BLOCKCHAIN COPYRIGHT CERTIFICATE', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(12).fillColor('#111')
        .text(`Holder (著作權人): ${realName}`)
        .text(`Birth Date (生日): ${birthDate}`)
        .text(`Phone: ${phone}`)
        .text(`Address: ${address}`)
        .text(`Email: ${email}`)
        .moveDown();

      // 區塊鏈資訊
      doc.fontSize(12).fillColor('#444')
        .text(`Original File: ${filename}`)
        .text(`Fingerprint (SHA-256): ${fingerprint}`)
        .text(`IPFS Hash: ${ipfsHash || '(None)'}`)
        .text(`Tx Hash: ${txHash || '(None)'}`)
        .moveDown();

      // 著作權法依據
      doc.fontSize(10).fillColor('#333').text(`
【繁中】自作品完成時即享有著作權，無需任何登記。 
本證書記載創作人、完成時間、區塊鏈雜湊等資訊，可用於法律舉證。
(著作權法第13條 等)
      `.trim());

      doc.moveDown();
      doc.fontSize(10).fillColor('#111').text(`
【EN】Under international copyright law, a work is protected upon completion.
This certificate, issued via blockchain immutability, serves as legal evidence of authorship and creation time.
      `);

      doc.moveDown();
      doc.fontSize(10).fillColor('#666')
        .text('© 2023 KaiKaiShield / SUZOO IP Guard. All Rights Reserved.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
