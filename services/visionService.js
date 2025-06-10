/**
 * services/visionService.js
 * ------------------------------------------------------------
 * Google Vision  - Web Detection 封裝 (含 includeGeoResults)
 * ------------------------------------------------------------
 */
const fs     = require('fs');
const path   = require('path');
const vision = require('@google-cloud/vision');

// --- link validator -----------------------------------------------------
const INVALID_PREFIX_RE = /^(javascript:|data:)/i;
const INVALID_CHAR_RE = /\s/;
function isValidLink(u) {
  if (!u) return false;
  const trimmed = u.trim();
  if (INVALID_PREFIX_RE.test(trimmed) || INVALID_CHAR_RE.test(trimmed)) return false;
  try {
    const uo = new URL(trimmed);
    return uo.protocol === 'http:' || uo.protocol === 'https:';
  } catch {
    return false;
  }
}

/** 1. 讀取 Service-Account JSON 路徑 ------------------------- */
const KEY_FILE =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(__dirname, '../../credentials/gcp-vision.json');

/** 2. 建立 Vision Client (單例) ----------------------------- */
const client = new vision.ImageAnnotatorClient({ keyFilename: KEY_FILE });

/**
 * 透過 Google Vision WebDetection 取得「網頁上出現此圖片」的網址
 * @param  {string} imagePath - 本機圖片路徑
 * @param  {number} maxResults (預設由環境變數 VISION_MAX_RESULTS 決定，預設 50)
 * @return {Promise<string[]>} 只回傳有效 http/https URL 陣列
 */
const DEFAULT_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

async function getVisionPageMatches(imagePath, maxResults = DEFAULT_MAX_RESULTS) {
  const buffer = await fs.promises.readFile(imagePath);

  /** 呼叫 annotateImage – 僅啟用 WebDetection ，限制 maxResults */
  const [res] = await client.annotateImage({
    image    : { content: buffer },
    features : [{
      type: 'WEB_DETECTION',
      maxResults,
      webDetectionParams: { includeGeoResults: true }   // ★ 加上取地理資訊
    }]
  });

  const wd = res.webDetection || {};
  const urls = [
    ...(wd.pagesWithMatchingImages || []).map(p => p.url),
    ...(wd.fullMatchingImages || []).map(i => i.url),
    ...(wd.partialMatchingImages || []).map(i => i.url)
  ].filter(isValidLink);

  const unique = [...new Set(urls)].slice(0, maxResults);
  return unique;
}

module.exports = { getVisionPageMatches };
