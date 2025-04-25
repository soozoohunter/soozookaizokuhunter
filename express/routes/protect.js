/*************************************************************
 * express/routes/protect.js
 * 
 * - 若檔案是 video/* & 非白名單 => 402 NEED_PAYMENT
 * - 若是 image/* 或白名單 => 仍免費
 * - 修正 rename 時不要使用 '/uploads/...'
 * - 確保使用者已有 username 欄位
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
const puppeteer = require('puppeteer');

// Multer 暫存
const upload = multer({ dest: 'uploads/' });

// 白名單 (允許無限 / 免付費)
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

/**
 * POST /api/protect/step1
 * - 上傳檔案 => 若是 video & 非白名單 => 402 NEED_PAYMENT
 * - 否則建立 User + Fingerprint + PDF
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

    // 1) 檢查必填
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

    // 2) 判斷是否 video => 需付費
    const mimeType = req.file.mimetype; // e.g. "video/mp4"
    const isVideo = mimeType.startsWith('video');
    // 用白名單做免付費判斷
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);

    if (isVideo && !isUnlimited) {
      // 短影音需付費 => 直接回 402
      fs.unlinkSync(req.file.path); // 刪除暫存
      return res.status(402).json({
        code: 'NEED_PAYMENT',
        error: '短影音功能需付費，請聯繫或購買方案'
      });
    }

    // 3) 若非白名單 => 檢查 phone/email 是否重複 (或您可直接允許重複)
    if (!isUnlimited) {
      const existUser = await User.findOne({
        where: {
          [Op.or]: [
            { phone },
            { email }
          ]
        }
      });
      if (existUser) {
        return res.status(409).json({
          code: 'ALREADY_MEMBER',
          error: '您已是會員，請直接登入或使用既有帳號'
        });
      }
    }

    // 4) 建立 User
    // ※ DB 需存在 username 欄位
    const rawPass = phone + '@KaiShield';
    const hashed = await bcrypt.hash(rawPass, 10);
    const newUser = await User.create({
      username: phone, // DB 要有 username
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

    // 5) Fingerprint => IPFS => 區塊鏈
    const fileBuf = fs.readFileSync(req.file.path);
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

    // 建立 File 紀錄
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
    });

    // 更新上傳次數
    if (isVideo) {
      newUser.uploadVideos++;
    } else {
      newUser.uploadImages++;
    }
    await newUser.save();

    // 6) rename => 保留檔案至 uploads/ (避免 / 開頭)
    const ext = path.extname(req.file.originalname) || '';
    const localDir = path.resolve(__dirname, '../../uploads'); 
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const targetPath = path.join(localDir, `imageForSearch_${newFile.id}${ext}`);
    fs.renameSync(req.file.path, targetPath);

    // 7) 產 PDF
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
    const pdfPath = path.join('uploads', `certificate_${newFile.id}.pdf`); 
    // 這裡可用相對路徑 "uploads/certificate_xxx.pdf"
    fs.writeFileSync(pdfPath, pdfBuf);

    // 回傳
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
    const pdfPath = path.join('uploads', `certificate_${req.params.fileId}.pdf`);
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
 * - 文字式爬蟲 + (image => 單張 googleReverseImage) or (short video => 抽frame)
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    let suspiciousLinks = [];
    const apiKey = process.env.RAPIDAPI_KEY;

    // 1) 文字爬蟲
    if (apiKey) {
      const searchQuery = file.filename || file.fingerprint || 'default';
      // Tiktok
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
        tiktokItems.forEach((item) => {
          if (item.link) suspiciousLinks.push(item.link);
        });
      } catch (errTik) {
        console.error('[Tiktok error]', errTik.message);
      }

      // IG
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

      // FB
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

    } else {
      console.warn('[scan] No RAPIDAPI_KEY => skip text-based crawl');
    }

    // 2) 以圖搜圖 / 或短影音抽圖
    const guessExt = path.extname(file.filename);
    const localDir = path.resolve(__dirname, '../../uploads');
    const localPath = path.join(localDir, `imageForSearch_${file.id}${guessExt}`);
    if (!fs.existsSync(localPath)) {
      // 檔案不存在 => 只回傳文字爬蟲
      const unique1 = Array.from(new Set(suspiciousLinks));
      file.status = 'scanned';
      file.infringingLinks = JSON.stringify(unique1);
      await file.save();
      return res.json({
        message: 'Text-based done. No local file => skip reverseImage',
        suspiciousLinks: unique1
      });
    }

    let googleResults = [];
    // 根據 user.uploadImages / uploadVideos 判斷
    const user = await User.findByPk(file.user_id);

    if (user && user.uploadImages > 0) {
      // 單張
      const singleLinks = await doGoogleReverseImage(localPath);
      googleResults.push(...singleLinks);
      suspiciousLinks.push(...singleLinks);
    }
    else if (user && user.uploadVideos > 0) {
      // 短影音 -> ffprobe => 時長 <=30 => 抽 frames
      try {
        const cmdProbe = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durationStr = execSync(cmdProbe).toString().trim();
        const durationSec = parseFloat(durationStr) || 9999;
        if (durationSec <= 30) {
          const outDir = path.join(localDir, `frames_${file.id}`);
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

          const cmdExtract = `ffmpeg -i "${localPath}" -vf fps=100 "${outDir}/frame_%05d.jpg"`;
          execSync(cmdExtract);

          const frameFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.jpg'));
          // 大量 google => 可能 reCAPTCHA
          for (let i = 0; i < frameFiles.length; i++) {
            const framePath = path.join(outDir, frameFiles[i]);
            const frameLinks = await doGoogleReverseImage(framePath);
            googleResults.push(...frameLinks);
            suspiciousLinks.push(...frameLinks);

            // if (i>10) break; // 避免過多
          }
        } else {
          console.log('[scan] video >30s => skip frames');
        }
      } catch(eVid) {
        console.error('[Video extraction error]', eVid);
      }
    }

    // 去重
    const uniqueLinks = Array.from(new Set(suspiciousLinks));
    file.status = 'scanned';
    file.infringingLinks = JSON.stringify(uniqueLinks);
    await file.save();

    return res.json({
      message: 'Scan done => text + googleReverseImage',
      suspiciousLinks: uniqueLinks,
      googleResults
    });

  } catch (err) {
    console.error('[scan error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 單張以圖搜圖 - Puppeteer
 */
async function doGoogleReverseImage(localPath) {
  const results = [];
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
      // 可能需要 executablePath, args
    });
    const page = await browser.newPage();
    await page.goto('https://images.google.com/', { waitUntil: 'networkidle2' });

    // 相機按鈕
    const cameraButtonSelector = 'div[jsname="Q4LuWd"] a.Q4LuWd';
    await page.waitForSelector(cameraButtonSelector, { timeout: 8000 });
    await page.click(cameraButtonSelector);

    // Upload an image
    const uploadTabSelector = 'a[aria-label="Upload an image"]';
    await page.waitForSelector(uploadTabSelector, { timeout: 8000 });
    await page.click(uploadTabSelector);

    // 上傳檔案
    const fileInputSelector = 'input#qbfile';
    await page.waitForSelector(fileInputSelector, { timeout: 8000 });
    const fileInput = await page.$(fileInputSelector);
    await fileInput.uploadFile(localPath);

    // 等4秒
    await page.waitForTimeout(4000);

    // 取得前5連結
    const resultsSelector = 'div.g a';
    await page.waitForSelector(resultsSelector, { timeout: 15000 });
    const links = await page.$$eval(resultsSelector, (anchors) =>
      anchors.slice(0, 5).map(a => a.href)
    );
    results.push(...links);

    console.log('[doGoogleReverseImage]', links);
  } catch (err) {
    console.error('[doGoogleReverseImage Error]', err);
  } finally {
    if (browser) await browser.close();
  }
  return results;
}

/**
 * 產 PDF => 含印章 + GM
 */
async function generatePdf({
  realName, birthDate, phone, address, email,
  title, keywords,
  filename, fingerprint, ipfsHash, txHash,
  serialNumber,
  fileBuffer, mimeType
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // 字型
      const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
      doc.font(fontPath);

      doc.fontSize(16).fillColor('#f97316')
        .text('著作權存證登記證明書', { align: 'center', underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#555')
        .text('(Certificate of Copyright Registration)', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(9).fillColor('#f00')
        .text(`Certificate Serial No.: ${serialNumber}`, { align: 'center' });
      doc.moveDown(1);

      // 印章
      try {
        const stampPath = path.join(__dirname, '../fonts/stamp.png');
        doc.image(stampPath, { fit: [80, 80], align: 'left' });
      } catch(eS){}

      doc.moveDown(1);
      // 權利主體
      doc.fontSize(11).fillColor('#111')
        .text('【權利主體 (Holder)】', { underline: true });
      doc.text(`• 姓名: ${realName}`);
      doc.text(`• 生日: ${birthDate}`);
      doc.text(`• 電話(帳號): ${phone}`);
      doc.text(`• 地址: ${address}`);
      doc.text(`• Email: ${email}`);
      doc.moveDown(1);

      doc.text('【著作資訊】', { underline: true });
      doc.text(`• Title: ${title}`);
      doc.text(`• Keywords: ${keywords}`);
      doc.text(`• 檔名: ${filename}`);
      doc.text(`• SHA256: ${fingerprint}`);
      doc.text(`• IPFS Hash: ${ipfsHash || '(None)'}`);
      doc.text(`• TxHash: ${txHash || '(None)'}`);
      doc.moveDown(1);

      doc.text('【作品截圖】', { underline: true });
      if (mimeType.startsWith('image')) {
        // 圖片 => 插入縮圖
        const tempImg = path.join(__dirname, `../temp_${Date.now()}.jpg`);
        fs.writeFileSync(tempImg, fileBuffer);
        doc.image(tempImg, { fit: [200, 150] });
        fs.unlinkSync(tempImg);
      } else if (mimeType.startsWith('video')) {
        // 影片 => ffmpeg 抽 1 秒
        try {
          const videoTemp = path.join(__dirname, `../tempvid_${Date.now()}.mp4`);
          const shotPath = path.join(__dirname, `../tempvidshot_${Date.now()}.jpg`);
          fs.writeFileSync(videoTemp, fileBuffer);
          execSync(`ffmpeg -i "${videoTemp}" -ss 00:00:01 -frames:v 1 -y "${shotPath}"`);
          doc.image(shotPath, { fit: [200, 150] });
          fs.unlinkSync(videoTemp);
          fs.unlinkSync(shotPath);
        } catch(eV){}
      } else {
        doc.text('(No preview for this file type)', { italic:true });
      }
      doc.moveDown(1);

      doc.fontSize(10).fillColor('#000')
        .text('依據伯恩公約、TRIPS 等國際規範，本公司於聯合國會員國(塞席爾Seychelles)設立，具全球法律效力，為初步舉證依據。');
      doc.moveDown(1);

      doc.text('GM / Zack Yao', { align:'right' });
      doc.moveDown(1);

      doc.fontSize(9).fillColor('#888')
        .text('(c) 2023 凱盾全球國際股份有限公司. All Rights Reserved.', { align:'center' });

      doc.end();
    } catch(err) {
      reject(err);
    }
  });
}

module.exports = router;
