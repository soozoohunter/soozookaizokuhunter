/********************************************************************************
 * express/services/visionService.js
 *
 * 單一責任：包裝 Google Vision WebDetection，供 routes/protect.js 呼叫。
 * - 自動偵測 GOOGLE_APPLICATION_CREDENTIALS，否則 fallback 至
 *   ../../credentials/gcp-vision.json
 * - 對 >4 MB 圖片採 filename 方式，避免 content Base64 造成 INVALID_ARGUMENT
 * - 過濾 javascript: / data: 之類無效 schema
 *
 * 2025‑06‑06
 ********************************************************************************/

const path   = require('path');
const vision = require('@google-cloud/vision');

// ────── 1. Client 建立 ──────
const keyFile =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(__dirname, '../../credentials/gcp-vision.json');

const client = new vision.ImageAnnotatorClient({ keyFilename: keyFile });

// ────── 2. 工具：過濾不合法 URL ──────
function isValidLink(u) {
  if (!u) return false;
  const low = u.trim().toLowerCase();
  if (low.startsWith('javascript:') || low.startsWith('data:')) return false;
  try {
    const t = new URL(u);
    return ['http:', 'https:'].includes(t.protocol);
  } catch {
    return false;
  }
}

/**
 * 取得 Google Vision WebDetection 之 pagesWithMatchingImages
 * @param  {string} imagePath   – 本機檔案路徑
 * @param  {number} maxResults  – 最多回傳幾筆 (預設 10)
 * @return {Promise<string[]>}  – 合法 HTTP/HTTPS 連結陣列
 */
async function getVisionPageMatches(imagePath, maxResults = 10) {
  try {
    const [res] = await client.webDetection({
      image: { source: { filename: imagePath } }, // 官方建議大圖用 filename
      maxResults,
    });

    const urls =
      res.webDetection?.pagesWithMatchingImages
        ?.map((p) => p.url)
        .filter(isValidLink) || [];

    console.log('[Vision] matched pages =>', urls);
    return urls;
  } catch (err) {
    console.error('[VisionService] error =>', err.message);
    return [];
  }
}

module.exports = { getVisionPageMatches };
