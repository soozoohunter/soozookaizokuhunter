// routes/scan.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const cloudinaryService = require('../services/cloudinaryService');
const ginifabEngine = require('../services/ginifabEngine');
const pdfService = require('../services/pdfService');
const videoUtil = require('../utils/videoUtil');

/**
 * GET /scan/:fileId
 * 根據檔案ID對已上傳的圖片或影片進行以圖搜圖掃描，生成侵權偵測報告
 */
router.get('/scan/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!fileId) {
      return res.status(400).json({ error: '缺少檔案ID參數' });
    }
    // 假設檔案是儲存在 uploads 目錄，以檔名或ID命名
    const filePath = path.join('uploads', fileId);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '找不到對應的上傳檔案' });
    }
    // 判斷檔案類型（副檔名或 MIME），以決定處理方式
    const ext = path.extname(filePath).toLowerCase();
    const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext); // 常見影片副檔名
    const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(ext);
    if (!isVideo && !isImage) {
      return res.status(400).json({ error: '不支援的檔案類型' });
    }

    // 收集要進行圖搜的影像列表（含本地路徑與雲端URL）
    const imagesToSearch = [];
    if (isVideo) {
      // 影片情況：提取5個幀影像
      const frames = await videoUtil.extractFrames(filePath, 5);
      // 逐一上傳每個幀到 Cloudinary，獲取URL
      const uploadPromises = frames.map(framePath => cloudinaryService.uploadImage(framePath));
      const uploadResults = await Promise.all(uploadPromises);
      // 將每個幀的 {本地路徑, 雲端URL} 推入待搜尋列表
      uploadResults.forEach((result, idx) => {
        imagesToSearch.push({ path: frames[idx], url: result.secure_url });
      });
    } else if (isImage) {
      // 圖片情況：直接使用原圖
      // 確保在上傳時已取得其 Cloudinary URL（此處假設upload.js已上傳並可從資料庫獲取）
      // 由於沒有使用資料庫，我們重新上傳一次取得URL（實務中應儲存URL避免重傳）
      const uploadResult = await cloudinaryService.uploadImage(filePath);
      imagesToSearch.push({ path: filePath, url: uploadResult.secure_url });
    }

    // 調用 ginifabEngine 搜圖服務，傳入待搜尋圖片陣列，獲取結果
    const results = await ginifabEngine.searchImages(imagesToSearch);

    // 生成侵權偵測報告 PDF，內容涵蓋搜尋結果
    const reportPath = await pdfService.generateReport(filePath, results);

    // （可選）清理暫存的影片幀圖片檔案
    // if (isVideo) { frames.forEach(f => fs.unlinkSync(f)); }

    // 回傳成功訊息與報告路徑
    res.json({
      message: '掃描完成',
      fileId: fileId,
      report: `/public/reports/${path.basename(reportPath)}`  // 假設報告PDF存於public下
    });
  } catch (err) {
    console.error('GET /scan/:fileId 發生錯誤：', err);
    res.status(500).json({ error: '伺服器錯誤，無法完成掃描' });
  }
});

module.exports = router;
