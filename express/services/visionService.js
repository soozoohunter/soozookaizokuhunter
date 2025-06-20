// === express/services/visionService.js (優化版) ===
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const tinEyeApi       = require('./tineyeApiService');
const rapidApiService = require('./rapidApiService');

console.log("==============================================");
console.log("DIAGNOSTIC LOG: GOOGLE_APPLICATION_CREDENTIALS =", process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log("DIAGNOSTIC LOG: RAPIDAPI_KEY               =", process.env.RAPIDAPI_KEY);
console.log("==============================================");

const visionClient     = new ImageAnnotatorClient();
const VISION_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function infringementScan({ buffer }) {
  if (!buffer) throw new Error('Buffer is required for infringement scan');
  console.log('[Service] Starting infringement scan...');
  const overallStart = Date.now();

  // 1) 建立唯一的 temp file
  const tmpDir      = os.tmpdir();
  const tmpFileName = `scan_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const tmpPath     = path.join(tmpDir, tmpFileName);
  let tmpOK = false;

  try {
    await fs.writeFile(tmpPath, buffer);
    console.log(`[Service] Temp file created: ${tmpPath}`);
    tmpOK = true;
  } catch (e) {
    console.error('[Service] Cannot write temp file:', e.message);
  }

  // 2) TinEye
  const tineyeResult = { success: false, links: [], error: null };
  if (tmpOK) {
    try {
      console.log('[Service] Calling TinEye API...');
      const start = Date.now();
      const result = await tinEyeApi.searchByFile(tmpPath);
      tineyeResult.success = true;
      tineyeResult.links   = result.links || [];
      console.log(`[Service] TinEye done in ${Date.now() - start}ms, found ${tineyeResult.links.length}`);
    } catch (e) {
      tineyeResult.error = e.message;
      console.error('[Service] TinEye error:', e.message);
    }
  }

  // 3) Google Vision
  const visionResult = { success: false, links: [], error: null };
  try {
    console.log('[Service] Calling Google Vision API...');
    const start = Date.now();
    const [result] = await visionClient.webDetection({ image: { content: buffer } });
    const pages     = result.webDetection.pagesWithMatchingImages || [];
    visionResult.links = pages.map(p=>p.url).filter(Boolean).slice(0, VISION_MAX_RESULTS);
    visionResult.success = true;
    console.log(`[Service] Vision done in ${Date.now() - start}ms, found ${visionResult.links.length}`);
  } catch (e) {
    visionResult.error = e.message;
    console.error('[Service] Vision error:', e.message);
  }

  // 4) RapidAPI 多平台反向圖搜
  const rapid = {};
  if (process.env.RAPIDAPI_KEY && tmpOK) {
    try {
      console.log('[Service] Calling RapidAPI integrations...');
      rapid.tiktok    = await rapidApiService.tiktokSearch(tmpPath);
      rapid.instagram = await rapidApiService.instagramSearch(tmpPath);
      rapid.facebook  = await rapidApiService.facebookSearch(tmpPath);
      rapid.youtube   = await rapidApiService.youtubeSearch(tmpPath);
    } catch (e) {
      console.error('[Service] RapidAPI error:', e.message);
    }
  } else {
    console.warn('[Service] Skipping RapidAPI (key or tmp file missing)');
  }

  // 5) 清理 temp file
  if (tmpOK && await fileExists(tmpPath)) {
    await fs.unlink(tmpPath).catch(e=>console.error('[Service] Temp cleanup failed:', e.message));
  }

  console.log(`[Service] Overall scan finished in ${Date.now() - overallStart}ms.`);
  return { tineye: tineyeResult, vision: visionResult, rapid };
}

async function searchVisionByBuffer(buffer) {
  const { vision } = await infringementScan({ buffer });
  return vision.links;
}

module.exports = { infringementScan, searchVisionByBuffer };
