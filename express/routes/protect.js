/*************************************************************
 * express/routes/protect.js
 * - 建User(若非白名單則限制重複) + PDF含印章, GM簽名
 * - (Short Video) => 若 <=30秒 => 抽3000張圖 => 逐張 Google 以圖搜圖
 * - (Image) => 單張 Google 以圖搜圖
 * - 文字爬蟲 => TikTok / IG / FB
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

// 白名單 (允許無限)
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

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

    // 檢查
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

    // 檢查 phone/email
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);
    if (!isUnlimited) {
      const existUser = await User.findOne({
        where: {
          [Op.or]: [{ phone }, { email }]
        }
      });
      if (existUser) {
        return res.status(409).json({
          error: '您已是會員，請至登入或註冊頁面',
          code: 'ALREADY_MEMBER'
        });
      }
    }

    // 建User
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

    // File record
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
    });

    // 上傳次數
    if (mimeType.startsWith('video')) {
      newUser.uploadVideos++;
    } else if (mimeType.startsWith('image')) {
      newUser.uploadImages++;
    }
    await newUser.save();

    // 保留檔案 => rename
    const ext = path.extname(req.file.originalname) || '';
    const localPath = path.join(__dirname, `../../uploads/imageForSearch_${newFile.id}${ext}`);
    fs.renameSync(req.file.path, localPath);

    // 產 PDF
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
 * - (1) 文字爬蟲 => TikTok / IG / FB
 * - (2) 若是 image => Puppeteer googleReverseImage(單張)
 * - (3) 若是 short video(<=30秒) => 抽3000張 => 對每張 googleReverseImage (示範)
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 先做文字爬蟲
    let suspiciousLinks = [];
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.warn('RAPIDAPI_KEY not set => 跳過文字爬蟲');
    } else {
      const searchQuery = file.filename || file.fingerprint || 'default';
      // TikTok
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
      } catch (e) {
        console.error('[Tiktok error]', e.message);
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
      } catch (e2) {
        console.error('[IG error]', e2.message);
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
      } catch (e3) {
        console.error('[FB error]', e3.message);
      }
    }

    // 再做以圖搜圖 / 或短片擷取
    const guessExt = path.extname(file.filename);
    const localPath = path.join(__dirname, `../../uploads/imageForSearch_${file.id}${guessExt}`);
    if (!fs.existsSync(localPath)) {
      // 沒找到檔 => 直接回傳文字爬蟲結果
      const unique1 = Array.from(new Set(suspiciousLinks));
      file.status = 'scanned';
      file.infringingLinks = JSON.stringify(unique1);
      await file.save();
      return res.json({
        message: 'Text-based done, no local file to do reverseImage',
        suspiciousLinks: unique1
      });
    }

    // 分辨是 image or short video
    const user = await User.findByPk(file.user_id);
    let googleResults = [];

    // 簡易判斷：若 user.uploadImages>0 => 代表這是圖
    if (user && user.uploadImages > 0) {
      // 單張 -> 直接 puppeteer
      console.log(`[scan] Single image => googleReverseImage(${localPath})`);
      const singleLinks = await doGoogleReverseImage(localPath);
      googleResults = singleLinks;
      suspiciousLinks = suspiciousLinks.concat(singleLinks);
    }
    // 若 user.uploadVideos>0 => 代表是視頻 => 檢查長度 <= 30秒 => ffprobe
    else if (user && user.uploadVideos > 0) {
      try {
        // ffprobe => 取得影片秒數
        const cmdProbe = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durationStr = execSync(cmdProbe).toString().trim(); 
        const durationSec = parseFloat(durationStr) || 9999;
        console.log('Video duration =>', durationSec);

        if (durationSec <= 30) {
          // 抽 3000 張 => fps=100
          // 指令: ffmpeg -i video.mp4 -vf fps=100 outDir/frame_%05d.jpg
          const outDir = path.join(__dirname, `../../uploads/frames_${file.id}`);
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

          const cmdExtract = `ffmpeg -i "${localPath}" -vf fps=100 "${outDir}/frame_%05d.jpg"`;
          execSync(cmdExtract);

          // 逐張 => googleReverseImage
          const frameFiles = fs.readdirSync(outDir).filter(f=>f.endsWith('.jpg'));
          // (極度建議只挑幾張！否則Google馬上封 or reCAPTCHA)
          // 這裡示範全部 => 3000張 = 3000 calls => 幾乎必被封
          for (let i=0; i<frameFiles.length; i++){
            const framePath = path.join(outDir, frameFiles[i]);
            console.log(`[scan] doGoogleReverseImage => ${frameFiles[i]}`);
            const frameLinks = await doGoogleReverseImage(framePath);
            googleResults = googleResults.concat(frameLinks);
            suspiciousLinks = suspiciousLinks.concat(frameLinks);
            // ※若要避免被封，可 sleep 幾秒 or break
          }
        }
        else {
          console.log('[scan] Video > 30s => skip frame extraction');
        }

      } catch(eVid){
        console.error('[Video extraction error]', eVid);
      }
    }

    // 合併
    const uniqueLinks = Array.from(new Set(suspiciousLinks));
    file.status = 'scanned';
    file.infringingLinks = JSON.stringify(uniqueLinks);
    await file.save();

    return res.json({
      message: 'Scan done => text + googleReverseImage (if short video or image)',
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
      // 可能要 additional config: executablePath, args etc
    });
    const page = await browser.newPage();
    await page.goto('https://images.google.com/', { waitUntil: 'networkidle2' });

    // 相機 icon
    const cameraButtonSelector = 'div[jsname="Q4LuWd"] a.Q4LuWd';
    await page.waitForSelector(cameraButtonSelector, { timeout: 8000 });
    await page.click(cameraButtonSelector);

    // Upload image
    const uploadTabSelector = 'a[aria-label="Upload an image"]';
    await page.waitForSelector(uploadTabSelector, { timeout: 8000 });
    await page.click(uploadTabSelector);

    // 上傳
    const fileInputSelector = 'input#qbfile';
    await page.waitForSelector(fileInputSelector, { timeout: 8000 });
    const fileInput = await page.$(fileInputSelector);
    await fileInput.uploadFile(localPath);

    // 等4秒
    await page.waitForTimeout(4000);

    // 抓前5連結
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

      // stamp
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
