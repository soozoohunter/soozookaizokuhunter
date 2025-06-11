const fs = require('fs');
const sharp = require('sharp');
const vision = require('@google-cloud/vision');

const TMP_PATH = '/app/uploads/tmp/scan_for_vision.jpg';
const DEFAULT_KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/credentials/gcp-vision.json';
const DEFAULT_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;
let client;

function getClient() {
  if (!client) {
    console.log(`[visionService] using credential file: ${DEFAULT_KEY_FILE}`);
    client = new vision.ImageAnnotatorClient({ keyFilename: DEFAULT_KEY_FILE });
  }
  return client;
}

async function convertToJpeg(src) {
  await sharp(src).jpeg({ quality: 80 }).toFile(TMP_PATH);
  return TMP_PATH;
}

async function getVisionPageMatches(filePath, maxResults = DEFAULT_MAX_RESULTS) {
  if (!fs.existsSync(filePath)) throw new Error('FILE_NOT_FOUND: ' + filePath);
  const tmp = await convertToJpeg(filePath);
  try {
    const buf = fs.readFileSync(tmp);
    const [res] = await getClient().webDetection({ image: { content: buf }, maxResults });
    const wd = res.webDetection || {};
    const urls = [
      ...(wd.fullMatchingImages || []).map(i => i.url),
      ...(wd.partialMatchingImages || []).map(i => i.url),
      ...(wd.pagesWithMatchingImages || []).map(p => p.url)
    ].filter(u => {
      try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch { return false; }
    });
    return [...new Set(urls)].slice(0, maxResults);
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('DECODER') || msg.includes('unsupported') || msg.includes('UNKNOWN')) {
      console.error('[visionService] getVisionPageMatches fail =>', msg);
      return [];
    }
    throw err;
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

module.exports = { getVisionPageMatches };
