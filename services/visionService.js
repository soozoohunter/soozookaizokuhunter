/**
 * services/visionService.js
 * ------------------------------------------------------------
 * Google Vision  - Web Detection 封裝
 * 2025-06-05  Zack (凱) 專案
 * ------------------------------------------------------------
 */
const fs     = require('fs');
const path   = require('path');
const vision = require('@google-cloud/vision');

/** ※ 1. 讀取 Service-Account JSON 路徑 ------------------------- */
const KEY_FILE =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(__dirname, '../../credentials/gcp-vision.json');

/** ※ 2. 建立 Vision Client ------------------------------------ */
const client = new vision.ImageAnnotatorClient({ keyFilename: KEY_FILE });

/**
 * 透過 Google Vision WebDetection 取得「網頁上出現此圖片」的網址
 * @param  {string} imagePath - 本機圖片路徑
 * @param  {number} maxResults (預設 10)
 * @return {Promise<string[]>} 只回傳有效 http/https URL 陣列
 */
async function getVisionPageMatches(imagePath, maxResults = 10) {
  const buffer = await fs.promises.readFile(imagePath);

  /** 呼叫 annotateImage – 僅啟用 WebDetection ，限制 maxResults */
  const [res] = await client.annotateImage({
    image    : { content: buffer },
    features : [{ type: 'WEB_DETECTION', maxResults }]
  });

  const pages = res.webDetection?.pagesWithMatchingImages ?? [];
  const urls  = pages
    .map(p => p.url)
    .filter(u => /^https?:\/\//i.test(u));   // 過濾無效連結

  return urls;
}

module.exports = { getVisionPageMatches };
