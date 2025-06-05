/**
 * services/visionService.js
 * Google Vision WebDetection 封裝
 * 2025-06-05
 */
const path   = require('path');
const vision = require('@google-cloud/vision');

/* 預設讀取環境變數，若未設定則 fallback 到 credentials/gcp-vision.json */
const KEY_FILE =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(__dirname, '../../credentials/gcp-vision.json');

const client = new vision.ImageAnnotatorClient({ keyFilename: KEY_FILE });

/**
 * 取得網路上出現過此圖片的網址列表
 * @param {string} imagePath – 本機檔案路徑
 * @param {number} maxResults – 回傳上限
 * @returns {Promise<string[]>}
 */
async function getVisionPageMatches(imagePath, maxResults = 10) {
  const [res] = await client.webDetection({
    image: { source: { filename: imagePath } },
    maxResults,
  });
  const urls =
    res.webDetection?.pagesWithMatchingImages
      ?.map((p) => p.url)
      .filter(Boolean) || [];
  return urls;
}

module.exports = { getVisionPageMatches };
