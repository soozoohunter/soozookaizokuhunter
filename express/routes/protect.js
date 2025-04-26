/*************************************************************
 * express/routes/protect.js
 * 
 * - 大檔案上傳防護：multer 限制 100MB
 * - 多搜尋引擎以圖搜圖 + 影片抽幀 + 截圖上傳IPFS + 區塊鏈
 * - 詳細錯誤碼 (code) + 更人性化的 error 訊息
 *************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs   = require('fs');
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

// 影片抽幀 + 多搜尋引擎(stealth) + 截圖上傳IPFS + 上鏈
const { extractKeyFrames } = require('../utils/extractFrames');
const { doMultiReverseImage } = require('../utils/multiEngineReverseImage');

// ★ multer: 100MB 上限 (可自行調整)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

// 白名單 (免付費)
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

/**
 * POST /api/protect/step1
 *  1) 上傳檔案 (multer) → 產生 req.file
 *  2) 若為短影片 + 非白名單 => 402
 *  3) 建立User (若無重複 Email / Phone) + Fingerprint + IPFS + 區塊鏈
 *  4) 產生 PDF + 回傳檔案資訊
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    // 若 multer fileSize 超限 => err.code==='LIMIT_FILE_SIZE'
    // 但還是可能出現 req.file 為 undefined 情況
    if (!req.file) {
      return res.status(400).json({
        code: 'NO_FILE_OR_TOO_BIG',
        error: '請上傳檔案，或檔案過大'
      });
    }

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

    // 必填
    if (!realName || !birthDate || !phone || !address || !email) {
      return res.status(400).json({
        code: 'EMPTY_REQUIRED',
        error: '缺少必填欄位(個人資料)'
      });
    }
    if (!title) {
      return res.status(400).json({
        code: 'NO_TITLE',
        error: '請輸入作品標題(title)'
      });
    }
    if (!keywords) {
      return res.status(400).json({
        code: 'NO_KEYWORDS',
        error: '請輸入關鍵字(keywords)'
      });
    }
    if (agreePolicy !== 'true') {
      return res.status(400).json({
        code: 'POLICY_REQUIRED',
        error: '請勾選同意隱私權政策與使用條款'
      });
    }

    // 判斷若影片 & 非白名單 => 402
    const mimeType = req.file.mimetype; // 'video/mp4', 'image/png'...
    const isVideo  = mimeType.startsWith('video');
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);
    if (isVideo && !isUnlimited) {
      fs.unlinkSync(req.file.path);
      return res.status(402).json({
        code: 'NEED_PAYMENT',
        error: '短影音上傳需付費，請聯繫客服或升級付費方案'
      });
    }

    // 檢查 Email / Phone 是否重複
    if (!isUnlimited) {
      const oldUser = await User.findOne({
        where: { [Op.or]: [{ email }, { phone }] }
      });
      if (oldUser) {
        return res.status(409).json({
          code: 'ALREADY_MEMBER',
          error: '此Email或手機已被使用，請改用已有帳號'
        });
      }
    }

    // 建立 User
    const rawPass   = phone + '@KaiShield';  // 預設密碼
    const hashedPass= await bcrypt.hash(rawPass, 10);
    const newUser = await User.create({
      username: phone,
      serialNumber: 'SN-' + Date.now(),
      email,
      phone,
      password: hashedPass,
      realName,
      birthDate,
      address,
      role: 'user',
      plan: 'freeTrial'
    });

    // Fingerprint => IPFS => 區塊鏈
    const fileBuf    = fs.readFileSync(req.file.path);
    const fingerprint= fingerprintService.sha256(fileBuf);

    let ipfsHash=null, txHash=null;
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch(eIPFS){
      console.error('[IPFS error]', eIPFS);
    }
    try {
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt?.transactionHash || null;
    } catch(eChain){
      console.error('[Chain error]', eChain);
    }

    // File 紀錄
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
    });

    // 更新 uploadImages / uploadVideos
    if (isVideo) newUser.uploadVideos++;
    else newUser.uploadImages++;
    await newUser.save();

    // rename => /uploads/
    const ext = path.extname(req.file.originalname) || '';
    const localDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const targetPath = path.join(localDir, `imageForSearch_${newFile.id}${ext}`);
    fs.renameSync(req.file.path, targetPath);

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
    const pdfFileName = `certificate_${newFile.id}.pdf`;
    const pdfFilePath = path.join(localDir, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuf);

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
    // 若 multer fileSize 超限 => err.code === 'LIMIT_FILE_SIZE'
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'FILE_TOO_LARGE',
        error: '檔案過大，請壓縮或縮小檔案再上傳'
      });
    }

    console.error('[protect step1 error]', err);
    return res.status(500).json({
      code: 'STEP1_ERROR',
      error: err.message || '上傳時發生未知錯誤'
    });
  }
});

/**
 * GET /api/protect/certificates/:fileId
 *  - 下載 PDF 證書
 */
router.get('/certificates/:fileId', async (req, res) => {
  try {
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath  = path.join(localDir, `certificate_${req.params.fileId}.pdf`);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        code: 'PDF_NOT_FOUND',
        error: 'PDF 證書不存在，可能尚未產生'
      });
    }
    // 下載 PDF
    res.download(pdfPath, `KaiKaiShield_Certificate_${req.params.fileId}.pdf`);
  } catch (err) {
    console.error('[Download PDF error]', err);
    return res.status(500).json({
      code: 'DOWNLOAD_ERROR',
      error: err.message || '無法下載PDF'
    });
  }
});

/**
 * GET /api/protect/scan/:fileId
 *  - 文字爬蟲(TikTok/IG/FB)
 *  - 圖片或短影片(<=30s) => 多搜尋引擎(stealth) + 抽幀 + 截圖=>IPFS=>上鏈
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({
        code: 'FILE_NOT_FOUND',
        error: '找不到此檔案或 FileID'
      });
    }

    let suspiciousLinks = [];
    const apiKey = process.env.RAPIDAPI_KEY;

    // (1) 文字爬蟲
    if (apiKey) {
      const searchQuery = file.filename || file.fingerprint || 'default';
      // Tiktok
      try {
        const rTT = await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search', {
          params: { keywords: searchQuery, region:'us', count:'5' },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
          }
        });
        const tiktokItems = rTT.data?.videos || [];
        tiktokItems.forEach(it => {
          if(it.link) suspiciousLinks.push(it.link);
        });
      } catch(eTT){
        console.error('[TT error]', eTT.message);
      }

      // IG
      try {
        const rIG = await axios.get('https://real-time-instagram-scraper-api.p.rapidapi.com/v1/reels_by_keyword', {
          params: { query:searchQuery },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'real-time-instagram-scraper-api.p.rapidapi.com'
          }
        });
        const igLinks = rIG.data?.results || [];
        suspiciousLinks.push(...igLinks);
      } catch(eIG){
        console.error('[IG error]', eIG.message);
      }

      // FB
      try {
        const rFB = await axios.get('https://facebook-scraper3.p.rapidapi.com/page/reels', {
          params: { page_id:'100064860875397' },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com'
          }
        });
        const fbLinks = rFB.data?.reels || [];
        suspiciousLinks.push(...fbLinks);
      } catch(eFB){
        console.error('[FB error]', eFB.message);
      }
    } else {
      console.warn('[scan] 無 RAPIDAPI_KEY => 跳過文字爬蟲');
    }

    // (2) 圖片 or 短影片
    const localDir = path.resolve(__dirname, '../../uploads');
    const guessExt = path.extname(file.filename) || '';
    const localPath= path.join(localDir, `imageForSearch_${file.id}${guessExt}`);

    if (!fs.existsSync(localPath)) {
      // 沒找到檔案 => 只回文字爬蟲結果
      const uniqueNoFile = Array.from(new Set(suspiciousLinks));
      file.status = 'scanned';
      file.infringingLinks = JSON.stringify(uniqueNoFile);
      await file.save();
      return res.json({
        message:'No local file => 只回文字爬蟲',
        suspiciousLinks: uniqueNoFile
      });
    }

    let allLinks = [...suspiciousLinks];
    const user = await User.findByPk(file.user_id);

    // 判斷是否為影片
    let isVideo = false;
    if (guessExt.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
      isVideo = true;
    }

    if (isVideo && user && user.uploadVideos > 0) {
      // 檢查影片時長 <=30s => 抽幀
      try {
        const cmdProbe = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durStr = execSync(cmdProbe).toString().trim();
        const durSec = parseFloat(durStr) || 9999;

        if (durSec <= 30) {
          // 抽幀
          const outDir = path.join(localDir, `frames_${file.id}`);
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

          const frames = await extractKeyFrames(localPath, outDir, 10);
          for (const fPath of frames) {
            const engineLinks = await doMultiReverseImage(fPath, file.id);
            allLinks.push(...engineLinks);
          }
        } else {
          console.log('[scan] video > 30s => 不抽幀 => 不做 multiEngine');
        }
      } catch(eVid){
        console.error('[ffprobe error]', eVid);
      }
    }
    else if(!isVideo && user && user.uploadImages>0) {
      // 圖片 => 多搜尋引擎
      const engineLinks = await doMultiReverseImage(localPath, file.id);
      allLinks.push(...engineLinks);
    }

    // (3) 去重
    const uniqueLinks = Array.from(new Set(allLinks));
    file.status = 'scanned';
    file.infringingLinks = JSON.stringify(uniqueLinks);
    await file.save();

    return res.json({
      message: 'Scan done => text + multiEngine + stealth + IPFS + chain',
      suspiciousLinks: uniqueLinks
    });
  } catch (err) {
    console.error('[scan error]', err);
    return res.status(500).json({
      code: 'SCAN_ERROR',
      error: err.message || '掃描時發生未知錯誤'
    });
  }
});

/**
 * 產 PDF => 與您原本邏輯類似
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
      const doc = new PDFDocument({ size:'A4', margin:50 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const fontPath = path.join(__dirname, '../fonts/NotoSansTC-VariableFont_wght.ttf');
      doc.font(fontPath);

      doc.fontSize(16).fillColor('#f97316')
        .text('著作權存證登記證明書', { align:'center', underline:true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#555')
        .text('(Certificate of Copyright Registration)', { align:'center' });
      doc.moveDown(1);

      doc.fontSize(9).fillColor('#f00')
        .text(`Certificate Serial No.: ${serialNumber}`, { align:'center' });
      doc.moveDown(1);

      // 權利主體
      doc.fontSize(11).fillColor('#111')
        .text('【權利主體(Holder)】', { underline:true });
      doc.text(`• 姓名: ${realName}`);
      doc.text(`• 生日: ${birthDate}`);
      doc.text(`• 電話(帳號): ${phone}`);
      doc.text(`• 地址: ${address}`);
      doc.text(`• Email: ${email}`);
      doc.moveDown(1);

      doc.text('【著作資訊】', { underline:true });
      doc.text(`• Title: ${title}`);
      doc.text(`• Keywords: ${keywords}`);
      doc.text(`• 檔名: ${filename}`);
      doc.text(`• SHA256: ${fingerprint}`);
      doc.text(`• IPFS Hash: ${ipfsHash || '(None)'}`);
      doc.text(`• TxHash: ${txHash || '(None)'}`);
      doc.moveDown(1);

      doc.text('【作品截圖】', { underline:true });
      const { execSync } = require('child_process');

      if (mimeType.startsWith('image')) {
        // 圖片 => 直接嵌入
        try {
          const tmpImg = path.join(__dirname, `../temp_${Date.now()}.jpg`);
          fs.writeFileSync(tmpImg, fileBuffer);
          doc.image(tmpImg, { fit: [200, 150] });
          fs.unlinkSync(tmpImg);
        } catch(e){}
      } else if (mimeType.startsWith('video')) {
        // 影片 => 抓第一秒畫面
        try {
          const tmpVid = path.join(__dirname, `../tmpvid_${Date.now()}.mp4`);
          const shotPath = path.join(__dirname, `../tmpvidshot_${Date.now()}.jpg`);
          fs.writeFileSync(tmpVid, fileBuffer);
          execSync(`ffmpeg -i "${tmpVid}" -ss 00:00:01 -frames:v 1 -y "${shotPath}"`);
          doc.image(shotPath, { fit: [200, 150] });
          fs.unlinkSync(tmpVid);
          fs.unlinkSync(shotPath);
        } catch(e){}
      } else {
        doc.text('(No preview)', { italic: true });
      }
      doc.moveDown(1);

      doc.fontSize(10).fillColor('#000')
        .text('依據伯恩公約、TRIPS 等國際規範，本公司於聯合國會員國(塞席爾)設立，具全球法律效力。');
      doc.moveDown(1);

      doc.text('GM / Zack Yao', { align:'right' });
      doc.moveDown(1);

      doc.fontSize(9).fillColor('#888')
        .text('(c) 2023 凱盾全球國際股份有限公司. All Rights Reserved.', { align:'center' });

      doc.end();
    } catch(e) {
      reject(e);
    }
  });
}

module.exports = router;
