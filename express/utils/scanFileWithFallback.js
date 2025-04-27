// utils/scanFileWithFallback.js

const { doMultiReverseImage } = require('./multiEngineReverseImageDirect'); 
// → direct approach (Bing/TinEye/Baidu) for local file
const { doGinifabEngine } = require('../services/ginifabEngine'); 
// → use ginifab for Bing/TinEye/Baidu? or just Bing/TinEye?
const cloudinary = require('cloudinary').v2;

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 三保險機制：
 * 1) 先嘗試 Cloudinary + doGinifabEngine (若失敗 => fallback)
 * 2) 再嘗試 doMultiReverseImage (local file => Bing/TinEye/Baidu)
 * 3) ...
 */
async function scanFileWithFallback(localFilePath, fileId) {
  // A. Cloudinary + Ginifab
  try {
    // 1. 上傳到 Cloudinary
    const uploadRes = await cloudinary.uploader.upload(localFilePath, { folder:'reverse_image_search' });
    const imageUrl = uploadRes.secure_url; 
    console.log('[ScanFallback] Uploaded to Cloudinary =>', imageUrl);

    // 2. 透過 ginifabEngine
    const resultGinifab = await doGinifabEngine(imageUrl, fileId);
    // 假設 doGinifabEngine 回傳 { success:true, data:{...} }
    return { approach:'cloudy+ginifab', ...resultGinifab };
  } catch(e) {
    console.warn('[ScanFallback] Cloudy+Ginifab fail => fallback to direct approach.', e);
  }

  // B. Direct approach => multiEngineReverseImage
  try {
    const directLinks = await doMultiReverseImage(localFilePath, fileId);
    return { approach:'directBingTinEyeBaidu', links: directLinks };
  } catch(e2) {
    console.error('[ScanFallback] direct approach fail => no further fallback.', e2);
    throw new Error('All approach fail => no results');
  }
}

module.exports = { scanFileWithFallback };
