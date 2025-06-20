// === express/services/visionService.js (優化修正版) ===
const fs = require('fs/promises'); // 使用異步的 fs/promises
const path = require('path');
const os = require('os');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const tinEyeApi = require('./tineyeApiService');
const rapidApiService = require('./rapidApiService'); // 引入 rapidApiService

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
 * @param {string} filePath 文件路徑
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
 * 執行侵權掃描 (整合 TinEye, Google Vision, RapidAPI)
 * @param {{buffer: Buffer, keyword: string}} param0 - 包含圖片 buffer 和用於文字搜尋的 keyword
 * @returns {Promise<{tineye: object, vision: object, rapid: object}>}
 */
async function infringementScan({ buffer, keyword }) {
  if (!buffer) throw new Error('Buffer is required for infringement scan');
  // 關鍵字對於 RapidAPI 是必要的
  if (!keyword) console.warn('[Service] Keyword not provided; RapidAPI searches will be skipped.');

  console.log('[Service] Starting infringement scan...');
  const overallStart = Date.now();

  // 為 TinEye 服務創建臨時文件
  const tmpDir = os.tmpdir();
  const tmpFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
  const tmpPath = path.join(tmpDir, tmpFileName);

  let tmpFileCreated = false;
  try {
    await fs.writeFile(tmpPath, buffer);
    console.log(`[Service] Temp file created for TinEye scan: ${tmpPath}`);
    tmpFileCreated = true;
  } catch (e) {
    console.error(`[Service] Failed to write temp file for API services: ${e.message}`);
  }


  // --- TinEye 掃描 (依賴暫存檔案) ---
  let tineyeResult = { success: false, links: [], error: null };
  if (tmpFileCreated) {
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


  // --- Google Vision 掃描 (依賴 Buffer) ---
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

  // --- RapidAPI 多平台文字搜索 (依賴 Keyword) ---
  const rapidResults = {};
  if (process.env.RAPIDAPI_KEY && keyword) {
    console.log(`[Service] Calling RapidAPI integrations with keyword: "${keyword}"`);

    // 分別呼叫並處理錯誤，避免一個失敗影響全部
    try {
      rapidResults.tiktok = await rapidApiService.tiktokSearch(keyword);
    } catch (err) {
      console.error('[Service] RapidAPI TikTok search failed:', err.message);
      rapidResults.tiktok = { error: err.message };
    }

    try {
      rapidResults.instagram = await rapidApiService.instagramSearch(keyword);
    } catch (err) {
      console.error('[Service] RapidAPI Instagram search failed:', err.message);
      rapidResults.instagram = { error: err.message };
    }

    try {
      rapidResults.facebook = await rapidApiService.facebookSearch(keyword);
    } catch (err) {
      console.error('[Service] RapidAPI Facebook search failed:', err.message);
      rapidResults.facebook = { error: err.message };
    }

    try {
      rapidResults.youtube = await rapidApiService.youtubeSearch(keyword);
    } catch (err) {
      console.error('[Service] RapidAPI Youtube failed:', err.message);
      rapidResults.youtube = { error: err.message };
    }

  } else {
    const reason = !process.env.RAPIDAPI_KEY ? "RAPIDAPI_KEY is not set" : "Keyword was not provided";
    console.warn(`[Service] Skipping RapidAPI integrations. Reason: ${reason}.`);
  }

  // 最後刪除為 TinEye 創建的臨時文件
  if (tmpFileCreated) {
    try {
      await fs.unlink(tmpPath);
      console.log(`[Service] Deleted temp file: ${tmpPath}`);
    } catch (e) {
      console.error(`[Service] Failed to delete temp file: ${e.message}`);
    }
  }


  console.log(`[Service] Overall scan finished in ${Date.now() - overallStart}ms
