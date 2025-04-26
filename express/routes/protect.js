/*************************************************************
 * express/routes/protect.js
 * (最終優化 + Stealth + 多搜尋引擎 + 影片抽幀 + 截圖上傳IPFS + 上鏈)
 * - 大檔案上傳防護：multer限制100MB
 * - 回傳錯誤碼 {code, error}，讓前端清楚顯示
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

// Models / Services
const { User, File } = require('../models');
const fingerprintService = require('../services/fingerprintService');
const ipfsService = require('../services/ipfsService');
const chain = require('../utils/chain');

// PDFKit
const PDFDocument = require('pdfkit');

// 抽幀與圖搜
const { extractKeyFrames } = require('../utils/extractFrames');
const { doMultiReverseImage } = require('../utils/multiEngineReverseImage');

// ====== 上傳限制 ======
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// 白名單 (免付費)
const ALLOW_UNLIMITED = [
  '0900296168',
  'jeffqqm@gmail.com'
];

/**
 * POST /api/protect/step1
 * 上傳檔案 => 產生User & File => Fingerprint => IPFS => 區塊鏈 => 產生PDF
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 'NO_FILE_OR_TOO_BIG',
        error: '請上傳檔案，或檔案過大'
      });
    }

    // 解構表單欄位
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

    // 必填檢查
    if (!realName || !birthDate || !phone || !address || !email) {
      return res.status(400).json({
        code: 'EMPTY_REQUIRED',
        error: '缺少必填欄位(個人資料)'
      });
    }
    if (!title) {
      return res.status(400).json({
        code: 'NO_TITLE',
        error: '請輸入作品標題'
      });
    }
    if (!keywords) {
      return res.status(400).json({
        code: 'NO_KEYWORDS',
        error: '請輸入關鍵字'
      });
    }
    if (agreePolicy !== 'true') {
      return res.status(400).json({
        code: 'POLICY_REQUIRED',
        error: '請勾選同意隱私權政策與使用條款'
      });
    }

    // 若為影片且非白名單 => 需付費
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

    // 若非白名單檢查 email/phone 重複
    if (!isUnlimited) {
      const oldUser = await User.findOne({
        where:{ [Op.or]: [{ email }, { phone }] }
      });
      if (oldUser) {
        return res.status(409).json({
          code: 'ALREADY_MEMBER',
          error: '此Email或手機已被使用，請改用已有帳號'
        });
      }
    }

    // === 建立User ===
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

    // === Fingerprint => IPFS => 區塊鏈 ===
    const fileBuf    = fs.readFileSync(req.file.path);
    const fingerprint= fingerprintService.sha256(fileBuf);

    let ipfsHash = null, txHash = null;
    try {
      ipfsHash = await ipfsService.saveFile(fileBuf);
    } catch(eIPFS){
      console.error('[IPFS error]', eIPFS);
    }
    try {
      // 區塊鏈存證
      const receipt = await chain.storeRecord(fingerprint, ipfsHash || '');
      txHash = receipt?.transactionHash || null;
    } catch(eChain){
      console.error('[Chain error]', eChain);
    }

    // === File紀錄 ===
    const newFile = await File.create({
      user_id: newUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
    });

    if(isVideo) newUser.uploadVideos++;
    else newUser.uploadImages++;
    await newUser.save();

    // move tmp => /uploads/
    const ext = path.extname(req.file.originalname) || '';
    const localDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive:true });
    }
    const targetPath = path.join(localDir, `imageForSearch_${newFile.id}${ext}`);
    fs.renameSync(req.file.path, targetPath);

    // === 產生 PDF ===
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

    // 寫檔
    const pdfName = `certificate_${newFile.id}.pdf`;
    const pdfPath = path.join(localDir, pdfName);
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

  } catch(err) {
    // multer fileSize 超限
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'FILE_TOO_LARGE',
        error: '檔案過大，請壓縮或縮小後再上傳'
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
 * 下載 PDF 證書
 */
router.get('/certificates/:fileId', async (req, res)=>{
  try {
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath = path.join(localDir, `certificate_${req.params.fileId}.pdf`);

    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({
        code: 'PDF_NOT_FOUND',
        error:'PDF 證書不存在，可能尚未產生'
      });
    }
    res.download(pdfPath, `KaiKaiShield_Certificate_${req.params.fileId}.pdf`);
  } catch(err){
    console.error('[Download PDF error]', err);
    return res.status(500).json({
      code: 'DOWNLOAD_ERROR',
      error: err.message || '無法下載 PDF'
    });
  }
});

/**
 * GET /api/protect/scan/:fileId
 * 圖片 / 影片 => 抽幀 => 以圖搜圖 => IPFS => 區塊鏈
 */
router.get('/scan/:fileId', async (req, res)=>{
  try {
    const file = await File.findByPk(req.params.fileId);
    if(!file){
      return res.status(404).json({
        code: 'FILE_NOT_FOUND',
        error:'找不到此檔案或 FileID'
      });
    }

    let suspiciousLinks = [];
    const apiKey = process.env.RAPIDAPI_KEY;

    // (1) 文字爬蟲範例
    if(apiKey){
      const searchQuery = file.filename || file.fingerprint || 'default';
      try {
        const rTT = await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search',{
          params:{ keywords: searchQuery, region:'us', count:'5' },
          headers:{
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host':'tiktok-scraper7.p.rapidapi.com'
          }
        });
        const tiktokItems = rTT.data?.videos||[];
        tiktokItems.forEach(it=>{
          if(it.link) suspiciousLinks.push(it.link);
        });
      } catch(eTT){ console.error('[TT error]', eTT.message); }
      // ... IG, FB
    } else {
      console.warn('[scan] No RAPIDAPI_KEY => skip text-based crawling');
    }

    // (2) 圖片 / 影片 => doMultiReverseImage
    const localDir = path.resolve(__dirname, '../../uploads');
    const ext = path.extname(file.filename)||'';
    const localPath= path.join(localDir, `imageForSearch_${file.id}${ext}`);
    if(!fs.existsSync(localPath)){
      file.status='scanned';
      file.infringingLinks = JSON.stringify([]);
      await file.save();
      return res.json({
        message:'no local file => only text-based done',
        suspiciousLinks:[]
      });
    }

    let allLinks = [...suspiciousLinks];
    const user = await User.findByPk(file.user_id);

    let isVideo = false;
    if(ext.match(/\.(mp4|mov|avi|mkv|webm)$/i)){
      isVideo = true;
    }

    // 若是影片且長度<=30s => 抽幀
    if(isVideo && user && user.uploadVideos>0){
      try {
        const cmdProbe=`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durStr= execSync(cmdProbe).toString().trim();
        const durSec= parseFloat(durStr)||9999;

        if(durSec<=30){
          const outDir = path.join(localDir, `frames_${file.id}`);
          if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);
          const frames= await extractKeyFrames(localPath, outDir, 10);
          for(const framePath of frames){
            const found= await doMultiReverseImage(framePath, file.id);
            allLinks.push(...found);
          }
        }
      } catch(eVid){
        console.error('[video ext error]', eVid);
      }
    }
    else if(!isVideo && user && user.uploadImages>0){
      // 直接對圖片跑 reverseImage
      const found= await doMultiReverseImage(localPath, file.id);
      allLinks.push(...found);
    }

    // 去重
    const uniqueLinks= Array.from(new Set(allLinks));
    file.status='scanned';
    file.infringingLinks= JSON.stringify(uniqueLinks);
    await file.save();

    return res.json({
      message:'Scan done => multiEngine => IPFS => chain',
      suspiciousLinks: uniqueLinks
    });

  } catch(err){
    console.error('[scan error]', err);
    return res.status(500).json({
      code:'SCAN_ERROR',
      error: err.message || '掃描時發生未知錯誤'
    });
  }
});

/**
 * 產生 PDF：嵌入繁體中文 & 圓形印章
 */
async function generatePdf({
  realName,
  birthDate,
  phone,
  address,
  email,
  title,
  keywords,
  filename,
  fingerprint,
  ipfsHash,
  txHash,
  serialNumber,
  fileBuffer,
  mimeType
}) {
  return new Promise((resolve, reject) => {
    try {
      // 1) 註冊繁體中文字體
      const fontsDir = path.join(__dirname, '../../fonts');
      const wenKai = path.join(fontsDir, 'LXGWWenKaiMonoTC-Bold.ttf');
      // 如果您另外有王羲之字體 => 
      // const wangXizhi = path.join(fontsDir, 'WangXizhi.ttf');

      // 若檔案存在 => register
      if (fs.existsSync(wenKai)) {
        PDFDocument.prototype.registerFont('KaiKaiChinese', wenKai);
      }
      // if (fs.existsSync(wangXizhi)) {
      //   PDFDocument.prototype.registerFont('KaiKaiCalligraphy', wangXizhi);
      // }

      // 2) 建立 PDFDocument
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 3) 使用繁體中文字體
      // 如果沒有成功 register，這裡會 fallback 預設字型
      doc.font('KaiKaiChinese').fontSize(18).text('KaiKaiShield 原創著作證明書', { align: 'center' });
      doc.moveDown();

      // 4) 內容
      doc.fontSize(12).text(`真實姓名: ${realName}`);
      doc.text(`生日: ${birthDate}`);
      doc.text(`手機: ${phone}`);
      doc.text(`地址: ${address}`);
      doc.text(`Email: ${email}`);
      doc.text(`作品標題: ${title}`);
      doc.text(`關鍵字: ${keywords}`);
      doc.moveDown();
      doc.text(`檔名: ${filename}`);
      doc.text(`Fingerprint (SHA-256): ${fingerprint}`);
      doc.text(`IPFS Hash: ${ipfsHash || 'N/A'}`);
      doc.text(`Tx Hash: ${txHash || 'N/A'}`);
      doc.text(`序號: ${serialNumber}`);
      doc.moveDown();
      doc.text(`檔案型態: ${mimeType}`);
      doc.text(`產生日期: ${new Date().toLocaleString()}`);

      doc.moveDown();
      doc.fontSize(10).text('本文件由 KaiKaiShield 系統自動產生，僅作為原創著作證明。');

      // 5) 插入圓形印章 stamp.png
      const stampPath = path.join(__dirname, '../../public/stamp.png');
      if (fs.existsSync(stampPath)) {
        doc.image(stampPath, {
          fit: [100, 100],
          align: 'center',
          valign: 'center'
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
