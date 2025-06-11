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
    // 检查并报错如果凭证文件不存在
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || DEFAULT_KEY_FILE;
    if (!fs.existsSync(keyFile)) {
      throw new Error(`Vision credential file missing: ${keyFile}`);
    }
    console.log(`[visionService] using credential file: ${keyFile}`);
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
    const msg = String(err.message || '');
    if (msg.includes('DECODER') || msg.includes('unsupported') || msg.includes('UNKNOWN')) {
      console.error('[visionService] getVisionPageMatches fail =>', msg);
      return [];
    }
    // 其它错误抛出
    throw err;

  } finally {
    // 清理临时文件
    try { fs.unlinkSync(TMP_PATH); } catch {}
  }
}

module.exports = { getVisionPageMatches, VISION_MAX_RESULTS };
