// express/utils/scanFileWithFallback.js

// (A) direct approach => (Bing/TinEye/Baidu)
const { doMultiReverseImage } = require('./multiEngineReverseImageDirect');

// (B) Ginifab approach => 需先上傳到 Cloudinary，再呼叫 doGinifabEngine
const { doGinifabEngine } = require('../services/ginifabEngine');
const cloudinary = require('cloudinary').v2;

// 若需要 Cloudinary，請在 .env 中設定 CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 三保險機制 (可再擴充更多)：
 * 1) 先嘗試：Cloudinary + doGinifabEngine
 * 2) 若失敗 => fallback: doMultiReverseImage (local file => Bing/TinEye/Baidu)
 * 3) ...
 *
 * @param {string} localFilePath - 本地檔案(已上傳到 /uploads/xxx.jpg)
 * @param {number} fileId - 用於紀錄(截圖命名等)
 * @returns {Object} e.g. { approach:'cloudy+ginifab', bingLinks:[], tineyeLinks:[], baiduLinks:[], screenshots:{} }
 */
async function scanFileWithFallback(localFilePath, fileId) {
  // ================= (1) Cloudinary + GinifabEngine =================
  try {
    // 上傳到 Cloudinary
    const uploadRes = await cloudinary.uploader.upload(localFilePath, {
      folder: 'reverse_image_search'
    });
    const imageUrl = uploadRes.secure_url;
    console.log('[ScanFallback] Cloudinary uploaded =>', imageUrl);

    // 呼叫 ginifabEngine
    const ginifabResult = await doGinifabEngine(imageUrl, fileId);

    // 回傳的 ginifabResult 可能是 { bingLinks:[], tineyeLinks:[], baiduLinks:[], screenshots:{} }
    // 為避免 key 衝突，我們整合 approach
    return { approach: 'cloudy+ginifab', ...ginifabResult };

  } catch (errCloudy) {
    console.warn('[ScanFallback] Ginifab approach fail => fallback to direct approach.', errCloudy);
  }

  // ================= (2) Direct approach => multiEngineReverseImage =================
  try {
    // e.g. doMultiReverseImageDirect => 回傳 link array
    const directLinks = await doMultiReverseImage(localFilePath, fileId);

    // 可視情況組成 { approach:'directBingTinEyeBaidu', links: directLinks }
    return { approach: 'directBingTinEyeBaidu', links: directLinks };

  } catch (errDirect) {
    console.error('[ScanFallback] direct approach fail => no further fallback.', errDirect);
    throw new Error('All approach fail => no results');
  }
}

module.exports = { scanFileWithFallback };
