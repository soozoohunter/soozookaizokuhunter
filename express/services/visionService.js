/**
 * express/services/visionService.js
 *
 * 單一責任：封裝 Google Cloud Vision WebDetection。
 * - 自動偵測 GOOGLE_APPLICATION_CREDENTIALS，否則預設讀取 ../../credentials/gcp-vision.json
 * - 超過 8 MB 圖片上傳限制前，先壓縮 (sharp)
 * - 預先做指紋雜湊和 LRU 快取，避免重複扣費
 * - 僅回傳有效 http/https 網址
 */

const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const sharp   = require('sharp');
const vision  = require('@google-cloud/vision');

const DEFAULT_KEY_FILE    = '/app/credentials/gcp-vision.json';
const MAX_VISION_SIZE     = 8 * 1024 * 1024;  // Vision 上限 8 MB
const COMPRESS_THRESHOLD  = 7 * 1024 * 1024;  // >7 MB 就壓縮
const LRU_CAPACITY        = 100;             // 最多快取 100 筆

// --- Vision client ---
let visionClient;
function getClient() {
  if (!visionClient) {
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || DEFAULT_KEY_FILE;
    console.log(`[visionService] using credential file: ${keyFile}`);
    if (!fs.existsSync(keyFile)) {
      console.error(`[visionService] credential file missing: ${keyFile}`);
      throw new Error(`GOOGLE_APPLICATION_CREDENTIALS file not found at ${keyFile}`);
    }
    try {
      JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
    } catch (err) {
      console.error('[visionService] credential parse error =>', err.message);
      console.error('[visionService] make sure GOOGLE_APPLICATION_CREDENTIALS points to a valid service account JSON');
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS file invalid');
    }
    try {
      visionClient = new vision.ImageAnnotatorClient({ keyFilename: keyFile });
    } catch (err) {
      console.error('[visionService] failed to create Vision client =>', err.message);
      if (err.code === 16) { // UNAUTHENTICATED
        console.error('[visionService] authentication failed. Check your credential file and GOOGLE_APPLICATION_CREDENTIALS env variable.');
      } else {
        console.error('[visionService] unexpected error while creating Vision client =>', err);
      }
      throw err;
    }
  }
  return visionClient;
}

// --- In-Memory LRU ---
const lruMap = new Map(); // key: fileHash, val: { t, data }
function setCache(k, data) {
  lruMap.set(k, { t: Date.now(), data });
  if (lruMap.size > LRU_CAPACITY) {
    const oldestKey = [...lruMap.entries()].sort((a, b) => a[1].t - b[1].t)[0][0];
    lruMap.delete(oldestKey);
  }
}
function getCache(k) {
  const hit = lruMap.get(k);
  if (hit) {
    hit.t = Date.now();
    return hit.data;
  }
  return null;
}

// --- 壓縮工具 ---
async function readAndMaybeCompress(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length <= COMPRESS_THRESHOLD) return buf;
  try {
    let out = await sharp(buf)
      .resize({ width: 1600, height: 1600, fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();
    if (out.length > MAX_VISION_SIZE) {
      out = await sharp(buf)
        .resize({ width: 1200, height: 1200, fit: 'inside' })
        .jpeg({ quality: 70 })
        .toBuffer();
    }
    return out;
  } catch (err) {
    console.error('[visionService] compress fail => fallback to original', err);
    return buf.slice(0, MAX_VISION_SIZE - 1024);
  }
}

// --- 過濾連結 ---
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

/**
 * 取得 Google Vision WebDetection 結果網址清單
 * - 合併 fullMatchingImages / partialMatchingImages / pagesWithMatchingImages
 * @param {string} filePath - 本機圖檔路徑
 * @param {number} [maxResults] - 回傳數量上限 (預設由環境變數 VISION_MAX_RESULTS 決定，預設 50)
 * @returns {Promise<string[]>}
 */
const DEFAULT_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

async function getVisionPageMatches(filePath, maxResults = DEFAULT_MAX_RESULTS) {
  if (!fs.existsSync(filePath)) {
    throw new Error('FILE_NOT_FOUND: ' + filePath);
  }
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) throw new Error('EXPECTED_A_FILE: ' + filePath);

  const hashKey = `${stat.size}_${crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex')}`;
  const cacheHit = getCache(hashKey);
  if (cacheHit) {
    return cacheHit.slice(0, maxResults);
  }

  let urls = [];
  try {
    const buf = await readAndMaybeCompress(filePath);
    const [res] = await getClient().webDetection({ image: { content: buf }, maxResults });
    const wd = res.webDetection || {};
    urls = [
      ...(wd.fullMatchingImages || []).map(i => i.url),
      ...(wd.partialMatchingImages || []).map(i => i.url),
      ...(wd.pagesWithMatchingImages || []).map(p => p.url)
    ].filter(isValidLink);
  } catch (err) {
    console.error('[visionService] getVisionPageMatches fail =>', err.message);
    return [];
  }

  const unique = [...new Set(urls)].slice(0, maxResults);
  setCache(hashKey, unique);
  console.log(`[visionService] matched => ${filePath} =>`, unique);
  return unique;
}

module.exports = {
  getVisionPageMatches
};
