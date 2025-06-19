// === express/services/visionService.js (最終修正版) ===
const fs = require('fs/promises'); // 使用異步的 fs/promises
const path = require('path');
const os = require('os');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const tinEyeApi = require('./tineyeApiService');
const rapidApiService = require('./rapidApiService'); // 新增引入

// --- [診斷程式碼開始] ---
console.log("==============================================");
console.log("DIAGNOSTIC LOG: Checking Environment Variable...");
console.log(`Value of GOOGLE_APPLICATION_CREDENTIALS is: "${process.env.GOOGLE_APPLICATION_CREDENTIALS}"`);
console.log("==============================================");
// --- [診斷程式碼結束] ---

const visionClient = new ImageAnnotatorClient();
console.log('[Service] Google Vision Client initialized.');

const VISION_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

/**
 * 檢查文件是否存在 (異步版本)
 * @param {string} path 文件路徑
 * @returns {Promise<boolean>} 如果文件存在則為 true，否則為 false
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 執行侵權掃描
 * @param {{buffer: Buffer}} param0
 * @returns {Promise<{tineye: object, vision: object}>}
 */
async function infringementScan({ buffer }) {
  if (!buffer) throw new Error('Buffer is required for infringement scan');
  console.log('[Service] Starting infringement scan...');
  const overallStart = Date.now();

  // 為 TinEye 和 RapidAPI 服務創建臨時文件
  const tmpDir = os.tmpdir();
  // 為了防止文件衝突，使用更具唯一性的文件名
  const tmpFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`; // 假設為 JPG
  const tmpPath = path.join(tmpDir, tmpFileName);

  let tmpFileCreated = false;
  try {
    await fs.writeFile(tmpPath, buffer);
    console.log(`[Service] Temp file created for scan: ${tmpPath}`);
    tmpFileCreated = true;
  } catch (e) {
    console.error(`[Service] Failed to write temp file for API services: ${e.message}`);
    // 如果無法寫入臨時文件，相關的 API 調用將會跳過或失敗
    // 但不阻斷整個掃描流程，因為 Google Vision 不依賴文件路徑
  }


  // --- TinEye 掃描 ---
  let tineyeResult = { success: false, links: [], error: null };
  if (tmpFileCreated) { // 只有當臨時文件成功創建時才嘗試 TinEye
    try {
      console.log('[Service] Calling TinEye API...');
      const start = Date.now();
      const result = await tinEyeApi.searchByFile(tmpPath);
      tineyeResult = { success: true, links: result.links || [] };
      console.log(`[Service] TinEye scan completed in ${Date.now() - start}ms, found ${tineyeResult.links.length} links.`);
    } catch (err) {
      console.error('[Service] TinEye API call failed:', err.message);
      tineyeResult = { success: false, links: [], error: err.message };
    }
  } else {
    console.warn('[Service] Skipping TinEye API due to temp file creation failure.');
  }


  // --- Google Vision 掃描 ---
  let visionResult = { success: false, links: [], error: null };
  try {
    console.log('[Service] Calling Google Vision API...');
    const start = Date.now();
    const [result] = await visionClient.webDetection({ image: { content: buffer } });
    const webDetection = result.webDetection;
    let urls = [];
    if (webDetection && webDetection.pagesWithMatchingImages) {
      urls = webDetection.pagesWithMatchingImages.map(page => page.url).filter(Boolean);
    }
    visionResult = { success: true, links: [...new Set(urls)].slice(0, VISION_MAX_RESULTS) };
    console.log(`[Service] Google Vision scan completed in ${Date.now() - start}ms, found ${urls.length} links.`);
  } catch (err) {
    console.error('[Service] Google Vision API call failed:', err.message);
    if (err.code === 16) {
      console.error('[Service] FATAL: Google Vision Authentication failed! Verify key file, IAM role, and that the GOOGLE_APPLICATION_CREDENTIALS environment variable is correctly set inside the container.');
    }
    visionResult = { success: false, links: [], error: err.message };
  }

  // --- RapidAPI 多平台搜索 ---
  const rapidResults = {};
  // 只有當 RAPIDAPI_KEY 存在且臨時文件已成功創建時才嘗試調用 RapidAPI
  if (process.env.RAPIDAPI_KEY && tmpFileCreated) { // 這裡也使用 tmpFileCreated 旗標
    try {
      console.log('[Service] Calling RapidAPI integrations...');
      rapidResults.tiktok = await rapidApiService.tiktokSearch(tmpPath);
      rapidResults.instagram = await rapidApiService.instagramSearch(tmpPath);
      rapidResults.facebook = await rapidApiService.facebookSearch(tmpPath);
      rapidResults.youtube = await rapidApiService.youtubeSearch(tmpPath);
    } catch (err) {
      console.error('[Service] RapidAPI search error:', err.message);
    }
  } else {
    console.warn('[Service] RAPIDAPI_KEY is not set or temp file not available. Skipping RapidAPI integrations.');
  }

  // 最後刪除臨時文件，確保所有服務都使用完畢
  try {
    // 檢查文件是否存在並刪除
    if (tmpFileCreated && await fileExists(tmpPath)) { // 使用異步的 fileExists 函數
        await fs.unlink(tmpPath);
        console.log(`[Service] Deleted temp file: ${tmpPath}`);
    }
  } catch (e) {
    console.error(`[Service] Failed to delete temp file: ${e.message}`);
  }


  console.log(`[Service] Overall scan finished in ${Date.now() - overallStart}ms.`);

  return {
    tineye: tineyeResult,
    vision: visionResult,
    rapid: rapidResults, // 新增 rapid 搜索結果
  };
}

async function searchVisionByBuffer(buffer) {
  const { vision } = await infringementScan({ buffer });
  return vision.links;
}

module.exports = {
  infringementScan,
  searchVisionByBuffer,
};
