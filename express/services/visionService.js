const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const vision = require('@google-cloud/vision');

const TMP_PATH = '/app/uploads/tmp/scan_for_vision.jpg';
const DEFAULT_KEY_FILE = '/app/credentials/gcp-vision.json';
const VISION_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

let client;
function getClient() {
  if (!client) {
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || DEFAULT_KEY_FILE;
    if (!fs.existsSync(keyFile)) {
      throw new Error(`Vision credential file missing: ${keyFile}`);
    }
    console.log(`[visionService] using credential file: ${keyFile}`);
    client = new vision.ImageAnnotatorClient({ keyFilename: keyFile });
  }
  return client;
}

function isValidLink(u) {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function convertToJpeg(src) {
  fs.mkdirSync(path.dirname(TMP_PATH), { recursive: true });
  await sharp(src).jpeg({ quality: 80 }).toFile(TMP_PATH);
  return TMP_PATH;
}

async function getVisionPageMatches(filePath, maxResults = VISION_MAX_RESULTS) {
  if (!fs.existsSync(filePath)) throw new Error('FILE_NOT_FOUND: ' + filePath);
  let tmpFile = TMP_PATH;
  try {
    await convertToJpeg(filePath);
    const buf = fs.readFileSync(tmpFile);
    const [res] = await getClient().webDetection({ image: { content: buf }, maxResults });
    const wd = res.webDetection || {};
    const urls = [
      ...(wd.fullMatchingImages || []).map(i => i.url),
      ...(wd.partialMatchingImages || []).map(i => i.url),
      ...(wd.pagesWithMatchingImages || []).map(p => p.url)
    ].filter(isValidLink);
    return [...new Set(urls)].slice(0, maxResults);
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.includes('DECODER') || msg.includes('unsupported') || msg.includes('UNKNOWN')) {
      console.error('[visionService] getVisionPageMatches fail =>', msg);
      return [];
    }
    console.error('[visionService] getVisionPageMatches fail =>', msg);
    return [];
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

module.exports = { getVisionPageMatches, VISION_MAX_RESULTS };
