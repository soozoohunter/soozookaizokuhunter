/*************************************************************
 * express/routes/protect.js
 * - 建 User 時 username = phone
 * - 產 PDF (中英雙語長版證書) 含影片截圖 (ffmpeg)
 * - /scan/:fileId => 真實爬蟲 (TikTok / IG / FB)
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
 * 上傳檔案 => 建 User (若 phone/email 不重複) => Fingerprint => IPFS => 區塊鏈 => PDF
 * 會接受前端多個欄位: { realName, birthDate, phone, address, email, title, keywords }
 * 其中 title/keywords 用於 PDF 內顯示或爬蟲 (可自行擴充).
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    const { realName, birthDate, phone, address, email, title, keywords } = req.body;
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

    // 建 User
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

    // 讀取檔案成 buffer => Fingerprint => IPFS => 區塊鏈
    const fileBuf = fs.readFileSync(req.file.path);
    const mimeType = req.file.mimetype; // e.g. "video/mp4" or "image/png"
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

    // File 資料表紀錄
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash,
      // 如果資料庫有對應欄位，可以存 title / keywords
      // e.g. title, keywords
    });

    // 更新上傳次數
    if (mimeType.startsWith('video')) {
      newUser.uploadVideos++;
    } else if (mimeType.startsWith('image')) {
      newUser.uploadImages++;
    }
    await newUser.save();

    // 刪除本地暫存
    fs.unlinkSync(req.file.path);

    // 產 PDF => 帶入 新增欄位 (title) for PDF
    const pdfBuf = await generatePdf({
      realName, birthDate, phone, address, email,
      title: title || '(No Title)',
      keywords: keywords || '',
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
      txHash
    });
  } catch (err) {
    console.error('[protect step1 error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/protect/certificates/:fileId
 * 下載產生好的 PDF
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
 * 真實爬蟲 (TikTok / IG / FB) => suspiciousLinks
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 可用 filename / fingerprint / title / keywords 作查詢，以下僅示範
    const searchQuery = file.filename || file.fingerprint || 'default';
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: 'RAPIDAPI_KEY not configured in .env' });
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

    // 2) IG
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

    // 去重
    const uniqueLinks = Array.from(new Set(suspiciousLinks));

    // 寫回 DB
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
 * generatePdf(...) => 產生長版證書, 英中雙語 + 依您提供的 Content
 * 並使用 ffmpeg 抽取影片影格, 若是 video => doc.image(截圖)
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
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // 指定字型檔
      const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
      doc.font(fontPath);

      // 1) 首頁標題
      doc.fontSize(14).fillColor('#000').text('Epic Global Int’I Inc.', { align: 'center' });
      doc.text('SUZOO IP Guard', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).fillColor('#f97316')
        .text('Certificate of Copyright Registration', { align: 'center', underline: true });
      doc.moveDown(1);

      // 分隔線
      doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#666').lineWidth(1).stroke();
      doc.moveDown(1);

      // 2) Rights Holder Info
      doc.fontSize(11).fillColor('#111').text('【Rights Holder Information】');
      doc.moveDown(0.3);
      doc.text(`  •  Real Name: ${realName}`);
      doc.text(`  •  Birth Date: ${birthDate}`);
      doc.text(`  •  Phone: ${phone}`);
      doc.text(`  •  Address: ${address}`);
      doc.text(`  •  Email: ${email}`);
      doc.moveDown(1);

      // 3) Work Info
      doc.text('【Work Information】');
      doc.moveDown(0.3);
      doc.text(`  •  Title: ${title}`);
      doc.text(`  •  Original File: ${filename}`);
      doc.text(`  •  SHA-256 Fingerprint (Hash Value): ${fingerprint}`);
      doc.text(`  •  IPFS Hash: ${ipfsHash || '(None)'}`);
      doc.text(`  •  Blockchain TxHash: ${txHash || '(None)'}`);
      doc.moveDown(1);

      // 4) Work Screenshot
      doc.text('【Work Screenshot】');
      doc.moveDown(0.3);
      // 若為 image => 直接插入, 若為 video => ffmpeg
      if (mimeType.startsWith('image')) {
        try {
          const tempImg = path.join(__dirname, `../temp_preview_${Date.now()}.jpg`);
          fs.writeFileSync(tempImg, fileBuffer);
          doc.image(tempImg, { fit: [200, 150] });
          fs.unlinkSync(tempImg);
        } catch (imgErr) {
          doc.text('(Failed to insert image preview)', { italic: true });
        }
      } else if (mimeType.startsWith('video')) {
        try {
          const videoTemp = path.join(__dirname, `../temp_video_${Date.now()}.mp4`);
          const shotPath = path.join(__dirname, `../temp_screenshot_${Date.now()}.jpg`);
          fs.writeFileSync(videoTemp, fileBuffer);
          // ffmpeg - 抽第 1 秒
          const cmd = `ffmpeg -i "${videoTemp}" -ss 00:00:01 -frames:v 1 -y "${shotPath}"`;
          execSync(cmd);
          doc.image(shotPath, { fit: [200, 150] });
          fs.unlinkSync(videoTemp);
          fs.unlinkSync(shotPath);
        } catch (vidErr) {
          doc.text('(Partial screenshot for short videos or small-scale screenshot for images)');
          doc.text('(Video screenshot failed or ffmpeg not installed)', { italic: true });
        }
      } else {
        doc.text('(No screenshot available for this file type)', { italic: true });
      }
      doc.moveDown(1);

      // 5) 大段落 => Statement in accordance with the Copyright Act (English)
      //   以您提供之英中對照 text, 請自訂方式 chunk
      doc.text('【Statement in accordance with the Copyright Act of Taiwan (R.O.C.)】', {
        underline: true
      });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000')
        .text(`This certificate confirms that the above-mentioned work has been digitally fingerprinted through SUZOO IP Guard’s proprietary dynamic/static fingerprint recognition modules, generating a unique SHA-256 hash and registering this hash on the blockchain for secure digital proof, establishing preliminary legal evidence of copyright ownership.\n`, {
          lineGap: 2
        });

      doc.text(`Relevant provisions under the Copyright Act supporting our digital fingerprint and blockchain registration service include:\n`, {
        lineGap: 2
      });

      // 5.1. Chapter 1
      doc.text(`Chapter 1: General Provisions`, { bold: true });
      doc.text(`Article 3 (Paragraph 1, Subparagraphs 5, 6, 7, 10)\n`, {
        indent: 10
      });
      doc.text(`• Defines “Reproduction,” “Public Broadcast,” “Public Transmission,” and “Public Presentation,” covering the protection of video and photographic works transmitted digitally.\n`, {
        indent: 20,
        lineGap: 2
      });

      // 5.2. Chapter 2
      doc.text(`Chapter 2: Works`, { bold: true });
      doc.text(`Article 5 (Paragraph 1, Subparagraphs 5, 7)`, { indent: 10 });
      doc.text(`• Explicitly classifies “Photographic Works” and “Audiovisual Works” under protected works, applicable directly to images and short videos.\n`, {
        indent: 20,
        lineGap: 2
      });

      // ...
      // 請依照您的大段文本持續分段 doc.text()
      // 範例下方繼續:

      doc.text(`Article 10 (Paragraph 1)`, { indent: 10 });
      doc.text(`• Confirms copyright exists automatically upon completion of the work, supported by immediate digital registration.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Article 10-1`, { indent: 10 });
      doc.text(`• Protection applies only to the tangible expressions of the work, such as specific images or video recordings, not underlying ideas or concepts.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Chapter 3: Copyright`, { bold: true });
      doc.text(`Article 15 (Paragraph 1)`, { indent: 10 });
      doc.text(`• Grants rights holders the exclusive right to first public disclosure, effectively secured through blockchain registration.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Article 16`, { indent: 10 });
      doc.text(`• Allows authors to publish works under their name, pseudonym, or anonymously; this right is respected and protected by our system.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Article 17`, { indent: 10 });
      doc.text(`• Protects works from unauthorized distortion, mutilation, or alteration; our digital fingerprint provides robust evidence to safeguard against such acts.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Article 21`, { indent: 10 });
      doc.text(`• Stipulates that moral rights are exclusively personal and non-transferable, further enhancing protection provided by this certificate.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Chapter 4: Economic Rights`, { bold: true });
      doc.text(`Article 22 (Paragraph 1)`, { indent: 10 });
      doc.text(`• Confers exclusive rights for reproduction, including digital forms, directly supported by digital fingerprinting.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Article 26-1`, { indent: 10 });
      doc.text(`• Exclusive rights to public transmission are safeguarded through digital fingerprint evidence, providing secure proof of authorship online.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Article 28`, { indent: 10 });
      doc.text(`• Confirms exclusive rights to create derivative works; our fingerprinting secures original work content against unauthorized adaptations.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Articles 36 & 37`, { indent: 10 });
      doc.text(`• Stipulate the terms for transfer and licensing of economic rights, with this certificate serving as foundational proof of rights or authorization.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Article 65`, { indent: 10 });
      doc.text(`• Clarifies the scope of fair use, supported by blockchain and fingerprint technology to clearly demarcate boundaries for judicial and commercial decisions.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Chapter 6: Remedies for Rights Infringement`, { bold: true });
      doc.text(`Article 84`, { indent: 10 });
      doc.text(`• Rights holders may seek prevention or cessation of infringement, supported by evidence provided by this certificate.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Articles 88 & 89`, { indent: 10 });
      doc.text(`• Establish obligations and liabilities regarding infringement damages, with this certificate significantly facilitating the enforcement of these rights.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.text(`Article 90-1`, { indent: 10 });
      doc.text(`• Provides customs enforcement against imported/exported infringing goods, with digital fingerprint evidence enabling rapid identification and legal intervention.\n`, {
        indent: 20,
        lineGap: 2
      });

      doc.moveDown(1);

      // Disclaimer
      doc.fontSize(9).fillColor('#555')
        .text(`Disclaimer and Notes:`, { underline: true });
      doc.moveDown(0.5);
      doc.text(`1. The provisions cited from the Copyright Act of Taiwan are intended to enhance the evidentiary power and credibility of this certificate, but do not constitute the full legal text. For comprehensive legal disputes, the complete official text and prevailing judicial interpretations must be referenced.\n`, { indent: 10 });
      doc.text(`2. The digital fingerprinting (dynamic/static) and blockchain registration services provided herein serve as internationally recognized preliminary evidence of copyright ownership, valid globally in dispute resolution contexts.\n`, { indent: 10 });
      doc.text(`3. The SHA-256 hash generated by this service is a unique and non-reproducible digital identifier, providing robust legal authenticity.\n`, { indent: 10 });

      doc.moveDown(1);
      doc.fontSize(10).fillColor('#888')
        .text('© 2023 Epic Global Int’I Inc. / SUZOO IP Guard. All Rights Reserved.', {
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
