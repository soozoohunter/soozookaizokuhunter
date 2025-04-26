/*************************************************************
 * express/routes/protect.js
 * (最終優化 + Stealth + 多搜尋引擎 + 影片抽幀 + 截圖上傳IPFS + 上鏈)
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

// 影片抽幀 + 多搜尋引擎(stealth) + 截圖上 IPFS
const { extractKeyFrames } = require('../utils/extractFrames');
const { doMultiReverseImage } = require('../utils/multiEngineReverseImage');

// Multer 暫存到 uploads/
const upload = multer({ dest: 'uploads/' });

// 白名單 (免付費)
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
      return res.status(400).json({ error: '缺少必填欄位(個人資料)' });
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

    // 若影片 & 非白名單 => 收費
    const mimeType = req.file.mimetype;
    const isVideo  = mimeType.startsWith('video');
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);
    if (isVideo && !isUnlimited) {
      fs.unlinkSync(req.file.path);
      return res.status(402).json({
        code: 'NEED_PAYMENT',
        error: '短影音上傳需付費，請聯繫客服或升級付費方案'
      });
    }

    // 檢查重複 email/phone
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

    // 建 User
    const rawPass   = phone + '@KaiShield';
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
    const fileBuf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(fileBuf);

    let ipfsHash = null, txHash = null;
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

    if (isVideo) newUser.uploadVideos++;
    else newUser.uploadImages++;
    await newUser.save();

    // rename => uploads/
    const ext = path.extname(req.file.originalname) || '';
    const localDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive:true });
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
    console.error('[protect step1 error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/protect/certificates/:fileId
 */
router.get('/certificates/:fileId', async (req, res) => {
  try {
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath  = path.join(localDir, `certificate_${req.params.fileId}.pdf`);

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
 *  1) 文字爬蟲 (TikTok, IG, FB)
 *  2) 若是短影片(<=30s) => 抽幀 => 多搜尋引擎(stealth) + 截圖=>IPFS=>區塊鏈
 *     若是圖片 => 多搜尋引擎(stealth) + 截圖=>IPFS=>區塊鏈
 *  3) 統整 suspiciousLinks => 去重 => 存 DB
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
      } catch(eTT) { console.error('[TT error]', eTT.message); }

      // IG
      try {
        const rIG = await axios.get('https://real-time-instagram-scraper-api.p.rapidapi.com/v1/reels_by_keyword', {
          params: { query: searchQuery },
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'real-time-instagram-scraper-api.p.rapidapi.com'
          }
        });
        const igLinks = rIG.data?.results || [];
        suspiciousLinks.push(...igLinks);
      } catch(eIG){ console.error('[IG error]', eIG.message); }

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
      } catch(eFB){ console.error('[FB error]', eFB.message); }
    } else {
      console.warn('[scan] No RAPIDAPI_KEY => skip text-based');
    }

    // (2) 圖片or影片 => doMultiReverseImage
    const localDir = path.resolve(__dirname, '../../uploads');
    const guessExt = path.extname(file.filename) || '';
    const localPath = path.join(localDir, `imageForSearch_${file.id}${guessExt}`);

    if (!fs.existsSync(localPath)) {
      // 檔案不存在 => 只回文字爬蟲
      const uniqueNoFile = Array.from(new Set(suspiciousLinks));
      file.status = 'scanned';
      file.infringingLinks = JSON.stringify(uniqueNoFile);
      await file.save();
      return res.json({
        message:'no local file => only text-based done',
        suspiciousLinks: uniqueNoFile
      });
    }

    let allLinks = [...suspiciousLinks];
    const user = await User.findByPk(file.user_id);

    // 判斷影像 or 影片
    let isVideo = false;
    if(guessExt.match(/\.(mp4|mov|avi|mkv|webm)$/i)){
      isVideo = true;
    }

    if (isVideo && user && user.uploadVideos>0) {
      // 判斷是否 <=30s
      try {
        const cmdProbe = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durStr = execSync(cmdProbe).toString().trim();
        const durSec = parseFloat(durStr) || 9999;

        if(durSec<=30) {
          const outDir = path.join(localDir, `frames_${file.id}`);
          if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);

          // 抽10幀
          const frames = await extractKeyFrames(localPath, outDir, 10);

          // 多搜尋引擎
          for(const framePath of frames){
            const engineLinks = await doMultiReverseImage(framePath, file.id);
            allLinks.push(...engineLinks);
          }
        } else {
          console.log('[scan] video>30 => skip frames => no multiEngine');
        }
      } catch(eVid){
        console.error('[video ext error]', eVid);
      }
    }
    else if(!isVideo && user && user.uploadImages>0) {
      // 圖片 => 直接多搜尋引擎
      const engineLinks = await doMultiReverseImage(localPath, file.id);
      allLinks.push(...engineLinks);
    }

    // (3) 去重
    const uniqueLinks = Array.from(new Set(allLinks));
    file.status = 'scanned';
    file.infringingLinks = JSON.stringify(uniqueLinks);
    await file.save();

    return res.json({
      message:'Scan done => text + multiEngine + stealth + screenshot => IPFS => chain',
      suspiciousLinks: uniqueLinks
    });

  } catch(err) {
    console.error('[scan error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 產 PDF => 與您原本類似
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
      doc.on('data', c=>chunks.push(c));
      doc.on('end', ()=>resolve(Buffer.concat(chunks)));

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
      doc.text(`• IPFS Hash: ${ipfsHash||'(None)'}`);
      doc.text(`• TxHash: ${txHash||'(None)'}`);
      doc.moveDown(1);

      doc.text('【作品截圖】', { underline:true });
      const { execSync } = require('child_process');
      if (mimeType.startsWith('image')) {
        try {
          const tmpImg = path.join(__dirname, `../temp_${Date.now()}.jpg`);
          fs.writeFileSync(tmpImg, fileBuffer);
          doc.image(tmpImg, { fit:[200,150] });
          fs.unlinkSync(tmpImg);
        } catch(e){}
      } else if (mimeType.startsWith('video')) {
        try {
          const tmpVid   = path.join(__dirname, `../tmpvid_${Date.now()}.mp4`);
          const shotPath = path.join(__dirname, `../tmpvidshot_${Date.now()}.jpg`);
          fs.writeFileSync(tmpVid, fileBuffer);
          execSync(`ffmpeg -i "${tmpVid}" -ss 00:00:01 -frames:v 1 -y "${shotPath}"`);
          doc.image(shotPath, { fit:[200,150] });
          fs.unlinkSync(tmpVid);
          fs.unlinkSync(shotPath);
        } catch(e){}
      } else {
        doc.text('(No preview)', { italic:true });
      }
      doc.moveDown(1);

      doc.fontSize(10).fillColor('#000')
        .text('依據伯恩公約、TRIPS 等國際規範，本公司於聯合國會員國(塞席爾Seychelles)設立，具全球法律效力。');
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
