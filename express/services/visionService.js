// express/services/visionService.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const vision = require('@google-cloud/vision');

const TMP_PATH = '/app/uploads/tmp/scan_for_vision.jpg';
const DEFAULT_KEY_FILE = '/app/credentials/gcp-vision.json';
const VISION_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

let client;

/**
 * 延迟初始化并返回 Google Vision 客户端
 */
function getClient() {
  if (!client) {
    // 檢查並驗證憑證檔案
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || DEFAULT_KEY_FILE;
    if (!fs.existsSync(keyFile)) {
      throw new Error(`Vision credential file missing: ${keyFile}`);
    }
    let cred;
    try {
      cred = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
      if (!cred.private_key || !cred.client_email) {
        throw new Error('missing private_key or client_email');
      }
    } catch (e) {
      throw new Error(`Vision credential invalid: ${e.message}`);
    }
    console.log(`[visionService] using credential file: ${keyFile} (${cred.client_email})`);
    client = new vision.ImageAnnotatorClient({ keyFilename: keyFile });
  }
  return client;
}

/**
 * 将任意图片强制转换为 JPEG 并写入临时路径
 * @param {string} src 源文件路径
 * @returns {Promise<string>} 返回输出文件路径
 */
async function convertToJpeg(src) {
  // 确保目录存在
  fs.mkdirSync(path.dirname(TMP_PATH), { recursive: true });
  await sharp(src).jpeg({ quality: 80 }).toFile(TMP_PATH);
  return TMP_PATH;
}

/**
 * 检查链接是否为 http/https
 */
function isValidLink(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 调用 Google Vision WebDetection 并返回页面匹配链接
 * @param {string} filePath 本地图像路径
 * @param {number} [maxResults] 最大返回数量
 * @returns {Promise<string[]>}
 */
async function getVisionPageMatches(filePath, maxResults = VISION_MAX_RESULTS) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`FILE_NOT_FOUND: ${filePath}`);
  }

  // 转换成 JPEG
  await convertToJpeg(filePath);

  try {
    const buf = fs.readFileSync(TMP_PATH);
    const [res] = await getClient().webDetection({ image: { content: buf }, maxResults });
    const wd = res.webDetection || {};
    const urls = [
      ...(wd.fullMatchingImages || []).map(i => i.url),
      ...(wd.partialMatchingImages || []).map(i => i.url),
      ...(wd.pagesWithMatchingImages || []).map(p => p.url)
    ].filter(isValidLink);

    // 去重并截断
    return [...new Set(urls)].slice(0, maxResults);

  } catch (err) {
    console.error('[visionService] getVisionPageMatches fail =>', err.message || err);
    return [];

  } finally {
    // 清理临时文件
    try { fs.unlinkSync(TMP_PATH); } catch {}
  }
}

const os = require('os');
const tinEyeApi = require('./tineyeApiService');

/**
 * Perform infringement scan using TinEye and Google Vision with an image buffer.
 * @param {{buffer: Buffer}} param0
 * @returns {Promise<{tineye: object, vision: object}>}
 */
async function infringementScan({ buffer }) {
  if (!buffer) throw new Error('buffer required');
  const tmpDir = path.join(os.tmpdir(), 'infr-scan');
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `scan_${Date.now()}.jpg`);
  fs.writeFileSync(tmpPath, buffer);
  console.log(`[visionService] tmp file created: ${tmpPath}`);

  let tineyeRes = { success: false, links: [] };
  try {
    console.log('[visionService] calling TinEye API...');
    const data = await tinEyeApi.searchByFile(tmpPath, { limit: VISION_MAX_RESULTS });
    const links = tinEyeApi.extractLinks(data);
    tineyeRes = { success: links.length > 0, links: links.slice(0, VISION_MAX_RESULTS) };
    console.log(`[visionService] TinEye links: ${tineyeRes.links.length}`);
  } catch (err) {
    tineyeRes = { success: false, message: err.message };
    console.error('[visionService] TinEye error =>', err.message || err);
  }

  let visionRes = { success: false, links: [] };
  try {
    console.log('[visionService] calling Google Vision WebDetection...');
    const urls = await getVisionPageMatches(tmpPath, VISION_MAX_RESULTS);
    visionRes = { success: urls.length > 0, links: urls };
    console.log(`[visionService] Vision links: ${visionRes.links.length}`);
  } catch (err) {
    visionRes = { success: false, message: err.message };
    console.error('[visionService] Vision error =>', err.message || err);
  }

  try { fs.unlinkSync(tmpPath); } catch {}

  return { tineye: tineyeRes, vision: visionRes };
}

/**
 * Get Google Vision page matches from an image buffer.
 * @param {Buffer} buffer
 * @param {number} [maxResults]
 * @returns {Promise<string[]>}
 */
async function searchVisionByBuffer(buffer, maxResults = VISION_MAX_RESULTS) {
  if (!buffer) throw new Error('buffer required');
  const tmpDir = path.join(os.tmpdir(), 'vision-buf');
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `vision_${Date.now()}.jpg`);
  fs.writeFileSync(tmpPath, buffer);
  try {
    const urls = await getVisionPageMatches(tmpPath, maxResults);
    return urls;
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

module.exports = {
  getVisionPageMatches,
  VISION_MAX_RESULTS,
  infringementScan,
  searchVisionByBuffer
};
