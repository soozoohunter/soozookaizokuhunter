/*************************************************************
 * express/routes/protect.js
 * - 於建立 User 時，username = phone
 * - PDF 產生時強化排版/內容 + 插入 Logo 圖片
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

/**
 * POST /api/protect/step1
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
    const fileBuf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(fileBuf);

    let ipfsHash = null;
    let txHash = null;

    // IPFS
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch (err) {
      console.error('[IPFS error]', err);
    }

    // 區塊鏈
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt?.transactionHash || null;
    } catch (err) {
      console.error('[Chain error]', err);
    }

    // File記錄
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

    // 產生 PDF (含著作權存證 + 公司資訊 + 您提供的法令說明 + Logo)
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
 * 模擬 AI爬蟲
 */
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
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 產生 PDF：示範插入 Logo、更多排版
 * 只要您能在後端讀取到 logo0.jpg，即可替換下方路徑
 */
async function generatePdf({
  realName, birthDate, phone, address, email,
  filename, fingerprint, ipfsHash, txHash
}) {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ★ 插入 Logo (請確保路徑正確)：
      // 假設 Express 容器可讀取 '/app/frontend/public/logo0.jpg'
      // 若無法，請改成您真正掛載後可讀取的實際路徑
      try {
        doc.image('/app/frontend/public/logo0.jpg', {
          fit: [80, 80],
          align: 'center',
          valign: 'top'
        });
        doc.moveDown(1); // 空一行
      } catch (imgErr) {
        console.warn('Logo image not found or load error:', imgErr);
      }

      // 主標題
      doc
        .fontSize(20)
        .fillColor('#f97316')
        .text('著作財產權存證登記申請書', { align: 'center', underline: true });

      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .fillColor('#333')
        .text(`
中華智慧財產權協會 著作權存證登記申請書
(本證書為區塊鏈記錄 + IPFS 雙重防護之數位佐證)
`, { align: 'center' });

      doc.moveDown();
      doc
        .fontSize(12)
        .fillColor('#444')
        .text('【Epic Global Int’I Inc. 凱盾全球國際股份有限公司】')
        .text('■ 於 Republic of Seychelles 登記在案 (資料號: #185749)');

      doc.moveDown(1.5);

      // 分隔線
      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#f97316')
        .lineWidth(1)
        .stroke();

      doc.moveDown();

      // 基本著作人 / 作品資訊
      doc.fontSize(12).fillColor('#111');
      doc.text(`【著作權人】(Holder): ${realName}`);
      doc.text(`出生日期 (Birth Date): ${birthDate}`);
      doc.text(`聯絡電話 (Phone): ${phone}`);
      doc.text(`住址 (Address): ${address}`);
      doc.text(`Email: ${email}`);
      doc.moveDown(0.8);

      doc.fillColor('#111').text(`作品檔案 (Original File): ${filename}`);
      doc.text(`Fingerprint (SHA-256): ${fingerprint}`);
      doc.text(`IPFS Hash: ${ipfsHash || '(None)'}`);
      doc.text(`TxHash (區塊鏈交易): ${txHash || '(None)'}`);
      doc.moveDown(1);

      // 分隔線
      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#bbb')
        .lineWidth(1)
        .stroke();

      doc.moveDown(1);

      // 法規 / 申請書段落
      doc.fontSize(10).fillColor('#333').text(`
【員工利用公司資源所完成之職務著作】如雙方無特別約定，著作財產權歸公司所有，公司得行使該著作權。本證書所示之員工作品，即符合著作權法第11條之規範。
`, { indent: 20, lineGap: 3 });

      doc.moveDown(0.5);
      doc.text(`
【網路販售商品照片】若直接下載並使用他人拍攝之照片，可能構成侵害著作權法中「重製」或「公開傳輸」等專有權利。曾發生使用「韓國零食商品照」導致每張照片和解金新臺幣5萬元之案例。
`, { indent: 20, lineGap: 3 });

      doc.moveDown(0.5);
      doc.text(`
【教授出點子，學生撰寫程式】構想本身非著作權保護標的；程式著作人為實際撰寫之人，如欲使用該程式必須取得程式撰寫人之同意或約定。
`, { indent: 20, lineGap: 3 });

      doc.moveDown(0.5);
      doc.text(`
【影印店代客影印書籍】若超出合理使用，則可能構成重製他人著作之侵權行為；影印店亦需取得著作財產權人授權才能代為大範圍影印。
`, { indent: 20, lineGap: 3 });

      doc.moveDown(1);

      doc.fontSize(10).fillColor('#666').text(`
以上說明供參考，實際法律權利義務以著作權法及雙方合約為準。本存證登記書係結合區塊鏈與 IPFS 技術，作為著作確權、侵權取證之輔助依據。
`, { lineGap: 4 });

      doc.moveDown();
      doc
        .fontSize(10)
        .fillColor('#888')
        .text('(c) 2023 Epic Global Int’I Inc. / KaiKaiShield. All Rights Reserved.', {
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
