// === express/services/visionService.js (語法修正版) ===
const fs = require('fs/promises');
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

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (e) {
    return false;
  }
}

async function infringementScan({ buffer, keyword }) {
  if (!buffer) throw new Error('Buffer is required for infringement scan');
  if (!keyword) console.warn('[Service] Keyword not provided; RapidAPI searches will be skipped.');

  console.log('[Service] Starting infringement scan...');
  const overallStart = Date.now();

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

  const rapidResults = {};
  if (process.env.RAPIDAPI_KEY && keyword) {
    console.log(`[Service] Calling RapidAPI integrations with keyword: "${keyword}"`);
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

  if (tmpFileCreated) {
    try {
      await fs.unlink(tmpPath);
      console.log(`[Service] Deleted temp file: ${tmpPath}`);
    } catch (e) {
      console.error(`[Service] Failed to delete temp file: ${e.message}`);
    }
  }

  console.log(`[Service] Overall scan finished in ${Date.now() - overallStart}ms.`);

  return {
    tineye: tineyeResult,
    vision: visionResult,
    rapid: rapidResults,
  };
}

async function searchVisionByBuffer(buffer) {
  const { vision } = await infringementScan({ buffer, keyword: null });
  return vision.links;
}

module.exports = {
  infringementScan,
  searchVisionByBuffer,
};
