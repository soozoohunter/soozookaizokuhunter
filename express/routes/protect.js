/*************************************************************
 * express/routes/protect.js
 * (最終整合版本：包含白名單檢查 & PDF 字體絕對路徑修正)
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

const { extractKeyFrames } = require('../utils/extractFrames');
const { doMultiReverseImage } = require('../utils/multiEngineReverseImage');

// Multer 上傳限制
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }
});

// ★ 白名單 (免付費)
const ALLOW_UNLIMITED = [
  '0900296168',           // phone
  'jeffqqm@gmail.com'     // email
];

/**
 * POST /api/protect/step1
 * - 上傳檔案 + 新用戶(或使用舊用戶) + Fingerprint + IPFS + 區塊鏈 + 產 PDF
 */
router.post('/step1', upload.single('file'), async (req, res) => {
  try {
    // 1) 檔案檢查
    if (!req.file) {
      return res.status(400).json({
        code: 'NO_FILE_OR_TOO_BIG',
        error: '請上傳檔案，或檔案過大'
      });
    }

    // 2) 表單檢查
    const {
      realName, birthDate, phone, address, email,
      title, keywords, agreePolicy
    } = req.body;

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

    // 3) 判斷是否需付費
    const mimeType = req.file.mimetype;
    const isVideo  = mimeType.startsWith('video');
    const isUnlimited = ALLOW_UNLIMITED.includes(phone) || ALLOW_UNLIMITED.includes(email);

    if (isVideo && !isUnlimited) {
      // 短影音上傳，非白名單 => 收費
      fs.unlinkSync(req.file.path); // 先刪除暫存檔
      return res.status(402).json({
        code: 'NEED_PAYMENT',
        error: '短影音上傳需付費，請聯繫客服或升級付費方案'
      });
    }

    // 4) 檢查資料庫是否已有此 Email/Phone
    //    - 若有舊用戶 & 是白名單 => 後續直接用舊用戶
    //    - 若有舊用戶 & 非白名單 => 409 重複
    //    - 若無 => 建新用戶
    let finalUser = null;
    const oldUser = await User.findOne({
      where:{ [Op.or]: [{ email }, { phone }] }
    });

    if (oldUser) {
      if (!isUnlimited) {
        // 非白名單，卻已存在 => 報錯 409
        return res.status(409).json({
          code: 'ALREADY_MEMBER',
          error: '此Email或手機已被使用，請改用已有帳號'
        });
      } else {
        // 是白名單 => 直接使用舊用戶，跳過建立
        finalUser = oldUser;
      }
    } else {
      // 尚無舊用戶 => 建新用戶
      const rawPass   = phone + '@KaiShield';
      const hashedPass= await bcrypt.hash(rawPass, 10);

      finalUser = await User.create({
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
    }

    // 5) Fingerprint => IPFS => 區塊鏈
    const fileBuf = fs.readFileSync(req.file.path);
    const fingerprint = fingerprintService.sha256(fileBuf);

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

    // 6) File紀錄
    const newFile = await File.create({
      user_id: finalUser.id,
      filename: req.file.originalname,
      fingerprint,
      ipfs_hash: ipfsHash,
      tx_hash: txHash
    });

    // 依類型 +1
    if (isVideo) finalUser.uploadVideos++;
    else finalUser.uploadImages++;
    await finalUser.save();

    // 7) 移動檔案至 /uploads/
    const ext = path.extname(req.file.originalname) || '';
    const localDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(localDir)){
      fs.mkdirSync(localDir, { recursive:true });
    }
    const targetPath = path.join(localDir, `imageForSearch_${newFile.id}${ext}`);
    fs.renameSync(req.file.path, targetPath);

    // 8) 產生 PDF 證書
    const pdfBuf = await generatePdf({
      realName:  finalUser.realName,
      birthDate: finalUser.birthDate,
      phone:     finalUser.phone,
      address:   finalUser.address,
      email:     finalUser.email,
      title:     title.trim(),
      keywords:  keywords.trim(),
      filename:  req.file.originalname,
      fingerprint,
      ipfsHash,
      txHash,
      serialNumber: finalUser.serialNumber,
      fileBuffer: fileBuf,
      mimeType
    });

    const pdfFileName = `certificate_${newFile.id}.pdf`;
    const pdfFilePath = path.join(localDir, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuf);

    // 9) 若是新建帳號，回傳預設密碼；若是舊帳號(白名單)可視需求回傳
    const defaultPassword = oldUser ? null : (phone + '@KaiShield');

    return res.json({
      message:'上傳成功並完成 PDF！',
      fileId: newFile.id,
      pdfUrl:`/api/protect/certificates/${newFile.id}`,
      fingerprint,
      ipfsHash,
      txHash,
      // 若舊帳號就不回傳 password
      defaultPassword
    });

  } catch(err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'FILE_TOO_LARGE',
        error: '檔案過大，請壓縮或縮小檔案再上傳'
      });
    }
    console.error('[protect step1 error]', err);
    return res.status(500).json({
      code:'STEP1_ERROR',
      error: err.message || '上傳時發生未知錯誤'
    });
  }
});

/**
 * GET /api/protect/certificates/:fileId
 * - 提供下載 PDF
 */
router.get('/certificates/:fileId', async (req, res)=>{
  try {
    const localDir = path.resolve(__dirname, '../../uploads');
    const pdfPath = path.join(localDir, `certificate_${req.params.fileId}.pdf`);

    if(!fs.existsSync(pdfPath)){
      return res.status(404).json({
        code:'PDF_NOT_FOUND',
        error:'PDF 證書不存在，可能尚未產生'
      });
    }
    // 檔名可自行調整
    res.download(pdfPath, `KaiKaiShield_Certificate_${req.params.fileId}.pdf`);
  } catch(err){
    console.error('[Download PDF error]', err);
    return res.status(500).json({
      code:'DOWNLOAD_ERROR',
      error: err.message || '無法下載 PDF'
    });
  }
});

/**
 * GET /api/protect/scan/:fileId
 * - 文字爬蟲 + 圖片/影片搜圖
 */
router.get('/scan/:fileId', async (req, res)=>{
  try {
    const file = await File.findByPk(req.params.fileId);
    if(!file){
      return res.status(404).json({
        code:'FILE_NOT_FOUND',
        error:'找不到此檔案或 FileID'
      });
    }

    let suspiciousLinks = [];
    const apiKey = process.env.RAPIDAPI_KEY;

    // (A) 文字爬蟲(範例: TikTok)
    if(apiKey){
      const searchQuery = file.filename || file.fingerprint || 'default';
      try {
        const rTT = await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search', {
          params:{ keywords: searchQuery, region:'us', count:'5' },
          headers:{
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host':'tiktok-scraper7.p.rapidapi.com'
          }
        });
        const tiktokItems = rTT.data?.videos || [];
        tiktokItems.forEach(it=>{
          if(it.link) suspiciousLinks.push(it.link);
        });
      } catch(eTT){
        console.error('[TT crawler error]', eTT.message);
      }
      // ...IG/FB/其他爬蟲可自行擴充
    } else {
      console.warn('[scan] No RAPIDAPI_KEY => skip text-based crawling');
    }

    // (B) 圖片/影片 => 多引擎以圖搜圖
    const localDir = path.resolve(__dirname, '../../uploads');
    const ext = path.extname(file.filename) || '';
    const localPath= path.join(localDir, `imageForSearch_${file.id}${ext}`);

    // 若實體檔案不在 => 只回傳文字爬蟲結果
    if(!fs.existsSync(localPath)){
      file.status='scanned';
      file.infringingLinks = JSON.stringify([]);
      await file.save();
      return res.json({
        message:'file not found => only text-based crawling done',
        suspiciousLinks:[]
      });
    }

    let allLinks = [...suspiciousLinks];
    const user = await User.findByPk(file.user_id);

    // 檢查是否影片
    let isVideo = false;
    if(ext.match(/\.(mp4|mov|avi|mkv|webm)$/i)){
      isVideo = true;
    }

    if(isVideo && user && user.uploadVideos>0){
      try {
        // 先 ffprobe 取得影片長度
        const cmdProbe=`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localPath}"`;
        const durStr= execSync(cmdProbe).toString().trim();
        const durSec= parseFloat(durStr)||9999;

        // 若小於 30 秒 => 抽幀做多引擎搜圖
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
      // 圖片 => 直接多引擎搜圖
      const found= await doMultiReverseImage(localPath, file.id);
      allLinks.push(...found);
    }

    // 去重
    const uniqueLinks= [...new Set(allLinks)];
    file.status='scanned';
    file.infringingLinks= JSON.stringify(uniqueLinks);
    await file.save();

    return res.json({
      message:'Scan done => text + multi-engine => IPFS => chain',
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
 * 產生 PDF
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
      const doc = new PDFDocument({ size:'A4', margin:50 });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      // ★ 直接用絕對路徑 /app/fonts/*.ttf (與 Dockerfile 配合)
      const wenKai = '/app/fonts/LXGWWenKaiMonoTC-Bold.ttf';
      const notoTC = '/app/fonts/NotoSansTC-VariableFont_wght.ttf';

      let chosenFont = null;
      if (fs.existsSync(wenKai)) {
        chosenFont = wenKai;
      } else if (fs.existsSync(notoTC)) {
        chosenFont = notoTC;
      }

      if (chosenFont) {
        doc.registerFont('KaiKaiChinese', chosenFont);
        doc.font('KaiKaiChinese');
      } else {
        // 若出現此訊息，代表容器內 /app/fonts 未正常複製
        console.warn('[generatePdf] 未找到繁體字體檔，改用 Helvetica');
        doc.font('Helvetica');
      }

      doc.fontSize(18).text('KaiKaiShield 原創著作證明書', { align: 'center' });
      doc.moveDown();
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

      // ★ 印章，改用 /app/public/stamp.png (Dockerfile 有複製)
      const stampAbsolute = '/app/public/stamp.png';
      if (fs.existsSync(stampAbsolute)) {
        // 放在右下方(簡易做法)
        doc.moveDown(1);
        doc.image(stampAbsolute, doc.page.width - 130, doc.page.height - 180, {
          width: 80
        });
      }

      doc.moveDown();
      doc.fontSize(10).text('本文件由 KaiKaiShield 系統自動產生，僅作為原創著作證明。');
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = router;
