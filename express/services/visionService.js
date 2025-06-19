// === express/services/visionService.js (最終修正版) ===
const fs = require('fs/promises'); // 使用異步的 fs/promises
const path = require('path');
const os = require('os');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const tinEyeApi = require('./tineyeApiService');
const rapidApiService = require('./rapidApiService');

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

  // --- TinEye 掃描 (修正版) ---
  let tineyeResult = { success: false, links: [], error: null };
  // 為了與你現有的 tinEyeApiService.js (需要檔案路徑) 相容，我們先建立一個臨時檔案
  const tmpDir = path.join(os.tmpdir(), 'inf-scan');
  await fs.mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `scan_${Date.now()}.jpg`);
  
  try {
    await fs.writeFile(tmpPath, buffer);
    console.log(`[Service] Created temp file for TinEye: ${tmpPath}`);
    console.log('[Service] Calling TinEye API...');
    const start = Date.now();
    // 使用 searchByFile 並傳入檔案路徑
    const tineyeData = await tinEyeApi.searchByFile(tmpPath, { limit: VISION_MAX_RESULTS });
    const links = tinEyeApi.extractLinks(tineyeData);
    tineyeResult = { success: true, links: links.slice(0, VISION_MAX_RESULTS) };
    console.log(`[Service] TinEye scan completed in ${Date.now() - start}ms, found ${links.length} links.`);
  } catch (err) {
    console.error('[Service] TinEye API call failed:', err.message);
    tineyeResult = { success: false, links: [], error: err.message };
  } finally {
    // 無論成功或失敗，都嘗試刪除臨時檔案
    await fs.unlink(tmpPath).catch(e => console.error(`Failed to delete TinEye temp file: ${e.message}`));
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

  // --- RapidAPI 多平台搜尋 ---
  const rapidResults = {};
  if (process.env.RAPIDAPI_KEY) {
    try {
      console.log('[Service] Calling RapidAPI integrations...');
      rapidResults.tiktok = await rapidApiService.tiktokSearch(tmpPath);
      rapidResults.instagram = await rapidApiService.instagramSearch(tmpPath);
      rapidResults.facebook = await rapidApiService.facebookSearch(tmpPath);
      rapidResults.youtube = await rapidApiService.youtubeSearch(tmpPath);
    } catch (err) {
      console.error('[Service] RapidAPI search error:', err.message);
    }
  }

  console.log(`[Service] Overall scan finished in ${Date.now() - overallStart}ms.`);

  return {
    tineye: tineyeResult,
    vision: visionResult,
    rapid: rapidResults,
  };
}

async function searchVisionByBuffer(buffer){
  const { vision } = await infringementScan({ buffer });
  return vision.links;
}

module.exports = {
  infringementScan,
  searchVisionByBuffer,
};
