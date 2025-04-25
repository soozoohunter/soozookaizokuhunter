/*************************************************************
 * express/routes/protect.js
 * - 短影音需付費：若 video/* 而非白名單 => 回傳 402 NEED_PAYMENT
 * - 若 image/* 或白名單 => 仍免費進行 Fingerprint / IPFS / PDF
 * - /scan/:fileId => 依舊可對短影音(<=30秒)抽3000張 + GoogleReverseImage
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
const puppeteer = require('puppeteer'); // puppeteer 以圖搜圖

// Multer 暫存
const upload = multer({ dest: 'uploads/' });

// 白名單 (允許無限 / 免付費)
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

/**
 * POST /api/protect/step1
 * - 若上傳檔案為 video/* & 非白名單 => 402 NEED_PAYMENT
 * - 否則繼續 Fingerprint / IPFS / PDF
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

    // 2) 判斷是否 video 需要付費
    const mimeType = req.file.mimetype; // e.g. "video/mp4" or "image/png"
    const isVideo = mimeType.startsWith('video');
    // 下列只示範用白名單 ALLOW_UNLIMITED 做「免付費」判斷，實務可對照 user.plan
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);

    if (isVideo && !isUnlimited) {
      // 非白名單又是 video => 需付費
      // 刪除上傳暫存檔
      fs.unlinkSync(req.file.path);

      return res.status(402).json({
        code: 'NEED_PAYMENT',
        error: '短影音功能需付費方案，請前往付費或聯繫我們。'
      });
    }

    // 3) 檢查 phone/email 是否已有帳號 (若非白名單)
    if (!isUnlimited) {
      const existUser = await User.findOne({
        where: { [Op.or]: [{ phone }, { email }] }
      });
      if (existUser) {
        return res.status(409).json({
          code: 'ALREADY_MEMBER',
          error: '您已是會員，請至登入或註冊頁面'
        });
      }
    }

    // 4) 建立 User
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

    // 5) Fingerprint / IPFS / 區塊鏈
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

    // 6) File
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

    // rename => 保留檔案
    const ext = path.extname(req.file.originalname) || '';
    const localPath = path.join(__dirname, `../../uploads/imageForSearch_${newFile.id}${ext}`);
    fs.renameSync(req.file.path, localPath);

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
 * - 下載 PDF
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
 * - 文字式爬蟲 (TikTok / IG / FB)
 * - 若是 image => 單張 Puppeteer googleReverseImage
 * - 若是 short video(<=30秒) => 抽3000張 + googleReverseImage
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    let suspiciousLinks = [];
    const apiKey = process.env.RAPIDAPI_KEY;

    // (1) 文字爬蟲
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

    // (2) 以圖搜圖 or 短影音抽圖
    const guessExt = path.extname(file.filename);
    const localPath = path.join(__dirname, `../../uploads/imageForSearch_${file.id}${guessExt}`);

    if (!fs.existsSync(localPath)) {
      // 檔案不存在 => 只回傳文字爬蟲結果
      const unique1 = Array.from(new Set(suspiciousLinks));
      file.status = 'scanned';
      file.infringingLinks = JSON.stringify(unique1);
      await file.save();
      return res.json({
        message: 'Text-based done, no local file => no reverseImage',
        suspiciousLinks: unique1
      });
    }

    let googleResults = [];
    // 判斷檔案屬於 image or video
    const user = await User.findByPk(file.user_id);
    if (user && user.uploadImages > 0) {
      // 單張
      console.log(`[scan] Single image => googleReverseImage(${localPath})`);
      const singleLinks = await doGoogleReverseImage(localPath);
      googleResults = singleLinks;
      suspiciousLinks = suspiciousLinks.concat(singleLinks);
    }
    else if (user && user.uploadVideos > 0) {
      // 取得時長 => 若 <=30 => 抽3000張 + googleReverseImage
      try {
        const cmdProbe = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durationStr = execSync(cmdProbe).toString().trim();
        const durationSec = parseFloat(durationStr) || 9999;

        if (durationSec <= 30) {
          console.log('[scan] short video => extract frames => googleReverseImage...');
          const outDir = path.join(__dirname, `../../uploads/frames_${file.id}`);
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

          const cmdExtract = `ffmpeg -i "${localPath}" -vf fps=100 "${outDir}/frame_%05d.jpg"`;
          execSync(cmdExtract);

          const frameFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.jpg'));
          // 大量以圖搜圖非常容易被 Google block
          for (let i = 0; i < frameFiles.length; i++) {
            const framePath = path.join(outDir, frameFiles[i]);
            const frameLinks = await doGoogleReverseImage(framePath);
            googleResults = googleResults.concat(frameLinks);
            suspiciousLinks = suspiciousLinks.concat(frameLinks);

            // ★建議可 sleep 或只抽部分 frame
            // if (i >= 10) break; // 避免過多
          }
        } else {
          console.log('[scan] video > 30s => skip frame extraction');
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
      message: 'Scan done => text + googleReverseImage (if short video/image)',
      suspiciousLinks: uniqueLinks,
      googleResults
    });
  } catch (err) {
    console.error('[scan error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Puppeteer：Google Reverse Image (單張)
 */
async function doGoogleReverseImage(localPath) {
  const results = [];
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
      // 視 Docker/系統環境，可能需指定 executablePath 或額外參數
    });
    const page = await browser.newPage();
    await page.goto('https://images.google.com/', { waitUntil: 'networkidle2' });

    // 按相機 icon
    const cameraButtonSelector = 'div[jsname="Q4LuWd"] a.Q4LuWd';
    await page.waitForSelector(cameraButtonSelector, { timeout: 8000 });
    await page.click(cameraButtonSelector);

    // 點擊 "Upload an image"
    const uploadTabSelector = 'a[aria-label="Upload an image"]';
    await page.waitForSelector(uploadTabSelector, { timeout: 8000 });
    await page.click(uploadTabSelector);

    // 上傳檔案
    const fileInputSelector = 'input#qbfile';
    await page.waitForSelector(fileInputSelector, { timeout: 8000 });
    const fileInput = await page.$(fileInputSelector);
    await fileInput.uploadFile(localPath);

    // 等待 4 秒
    await page.waitForTimeout(4000);

    // 抓前 5 個搜尋結果
    const resultsSelector = 'div.g a';
    await page.waitForSelector(resultsSelector, { timeout: 15000 });
    const links = await page.$$eval(resultsSelector, (anchors) =>
      anchors.slice(0, 5).map((a) => a.href)
    );
    results.push(...links);

    console.log('[doGoogleReverseImage] Found =>', results);
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
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

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
        try {
          const tempImg = path.join(__dirname, `../temp_${Date.now()}.jpg`);
          fs.writeFileSync(tempImg, fileBuffer);
          doc.image(tempImg, { fit: [200, 150] });
          fs.unlinkSync(tempImg);
        } catch(eI){}
      } else if (mimeType.startsWith('video')) {
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
