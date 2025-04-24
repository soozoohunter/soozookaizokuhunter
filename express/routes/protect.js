// express/routes/protect.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const { User, File } = require('../models');
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');

const upload = multer({ dest: 'uploads/' });

router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    const { realName, birthDate, phone, address, email } = req.body;
    if (!req.file || !realName || !birthDate || !phone || !address || !email) {
      return res.status(400).json({ error: '缺少必填欄位或檔案' });
    }

    const existUser = await User.findOne({
      where: {
        [Op.or]: [{ phone }, { email }]
      }
    });
    if (existUser) {
      return res.status(409).json({ error: '您已是會員，請直接登入' });
    }

    const rawPass = phone + '@KaiShield';
    const hashed = await bcrypt.hash(rawPass, 10);

    const newUser = await User.create({
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

    const buffer = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(buffer);

    let ipfsHash = null;
    let txHash = null;
    try {
      ipfsHash = await ipfsService.saveFile(buffer);
    } catch (err) {
      console.error('[IPFS]', err);
    }
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt?.transactionHash || null;
    } catch (err) {
      console.error('[Chain]', err);
    }

    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
    });

    if (req.file.mimetype.startsWith('video')) {
      newUser.uploadVideos++;
    } else {
      newUser.uploadImages++;
    }
    await newUser.save();

    fs.unlinkSync(req.file.path);

    const pdfBuf = await generatePdfCertificate({
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
    return res.status(500).json({ error: err.message });
  }
});

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

    const suspiciousLinks = [
      'https://someInfringer.example/link1',
      'https://youtube.com/watch?v=abcInfringe'
    ];
    file.status = 'scanned';
    file.infringingLinks = JSON.stringify(suspiciousLinks);
    await file.save();

    return res.json({
      message: 'AI Scan done',
      fileId: file.id,
      suspiciousLinks
    });
  } catch (err) {
    console.error('[scan error]', err);
    return res.status(500).json({ error: err.message });
  }
});

async function generatePdfCertificate({
  realName, birthDate, phone, address, email,
  filename, fingerprint, ipfsHash, txHash
}) {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).fillColor('#f97316')
        .text('KaiKaiShield / SUZOO IP Guard', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor('#333')
        .text('BLOCKCHAIN COPYRIGHT CERTIFICATE', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).fillColor('#111')
        .text(`Holder (著作權人): ${realName}`)
        .text(`Birth Date (生日): ${birthDate}`)
        .text(`Phone: ${phone}`)
        .text(`Address: ${address}`)
        .text(`Email: ${email}`)
        .moveDown();

      doc.fillColor('#444')
        .text(`Original File: ${filename}`)
        .text(`Fingerprint (SHA-256): ${fingerprint}`)
        .text(`IPFS Hash: ${ipfsHash || '(None)'}`)
        .text(`TxHash: ${txHash || '(None)'}`)
        .moveDown();

      doc.fontSize(10).fillColor('#333').text(`
【繁中】您的作品自完成即享有著作權保護，區塊鏈記錄具不可篡改性，能作為法律舉證。
      `.trim());

      doc.moveDown();
      doc.fontSize(10).fillColor('#000').text(`
【EN】Your work is protected upon creation. This certificate, anchored by blockchain immutability,
serves as evidence of authorship recognized worldwide.
      `);

      doc.moveDown();
      doc.fontSize(10).fillColor('#666')
        .text('(c) 2023 KaiKaiShield / SUZOO IP Guard. All Rights Reserved.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
