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
 * 執行侵權掃描
 * @param {{buffer: Buffer}} param0
 * @returns {Promise<{tineye: object, vision: object}>}
 */
async function infringementScan({ buffer }) {
  if (!buffer) throw new Error('Buffer is required for infringement scan');
  console.log('[Service] Starting infringement scan...');
  const overallStart = Date.now();

  // 為 RapidAPI 服務創建臨時文件
  const tmpDir = os.tmpdir();
  const tmpFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`; // 假設為 JPG
  const tmpPath = path.join(tmpDir, tmpFileName);

  try {
    await fs.writeFile(tmpPath, buffer);
  } catch (e) {
    console.error(`Failed to write temp file for RapidAPI: ${e.message}`);
    // 如果無法寫入臨時文件，RapidAPI 相關的調用將會跳過或失敗
  }


  // --- TinEye 掃描 (修正版) ---
  let tineyeResult = { success: false, links: [], error: null };
  try {
    console.log('[Service] Calling TinEye API...');
    const start = Date.now();
    // 傳遞 tmpPath 而不是 buffer
    const result = await tinEyeApi.searchByFile(tmpPath);
    tineyeResult = { success: true, links: result.links || [] };
    console.log(`[Service] TinEye scan completed in ${Date.now() - start}ms, found ${tineyeResult.links.length} links.`);
  } catch (err) {
    console.error('[Service] TinEye API call failed:', err.message);
    tineyeResult = { success: false, links: [], error: err.message };
  } finally {
    // 無論成功或失敗，都嘗試刪除臨時檔案
    // 注意：這裡的 tmpPath 是為 TinEye 創建的，如果 RapidAPI 也使用此文件，則需謹慎處理刪除時機
    // 考慮到 RapidAPI 也在這裡使用 tmpPath，最終刪除放在整個函數結束時會更安全。
    // 但是，由於 TinEye 和 RapidAPI 可能需要不同的臨時文件處理方式，
    // 這裡我們假設 TinEye 處理完畢後可以立即刪除其專用文件。
    // 如果 RapidAPI 需要相同文件，則必須在整個函數結束時處理。
    // 根據你提供的 diff，tmpPath 是在 TinEye 之前建立的，所以可以在 TinEye 後刪除。
    // 但因為 RapidAPI 也會用到 tmpPath，所以不能在 TinEye 後就刪除，應該放在整個 infringementScan 函數的末尾。
    // 為了安全，我們將刪除邏輯移到最外層的 finally 區塊。
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
  if (process.env.RAPIDAPI_KEY) { // 檢查 RAPIDAPI_KEY 是否存在
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
    console.warn('[Service] RAPIDAPI_KEY is not set. Skipping RapidAPI integrations.');
  }

  // 最後刪除臨時文件，確保所有服務都使用完畢
  try {
    if (tmpPath && fs.existsSync(tmpPath)) {
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
