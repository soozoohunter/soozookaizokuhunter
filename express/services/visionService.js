const { ImageAnnotatorClient } = require('@google-cloud/vision');
const tinEyeApi = require('./tineyeApiService');

const visionClient = new ImageAnnotatorClient();
console.log('[Service] Google Vision Client initialized.');

const VISION_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

async function infringementScan({ buffer }) {
  if (!buffer) {
    throw new Error('Buffer is required for infringement scan');
  }
  console.log('[Service] Starting infringement scan...');
  const overallStart = Date.now();

  let tineyeResult = { success: false, links: [], error: null };
  try {
    console.log('[Service] Calling TinEye API...');
    const start = Date.now();
    const tineyeData = await tinEyeApi.searchByBuffer(buffer);
    const links = tinEyeApi.extractLinks(tineyeData);
    tineyeResult = { success: true, links: links.slice(0, VISION_MAX_RESULTS) };
    console.log(`[Service] TinEye scan completed in ${Date.now() - start}ms, found ${links.length} links.`);
  } catch (err) {
    console.error('[Service] TinEye API call failed:', err.message);
    tineyeResult = { success: false, links: [], error: err.message };
  }

  let visionResult = { success: false, links: [], error: null };
  try {
    console.log('[Service] Calling Google Vision API...');
    const start = Date.now();
    const [result] = await visionClient.webDetection({ image: { content: buffer } });
    const webDetection = result.webDetection;
    let urls = [];
    if (webDetection && webDetection.pagesWithMatchingImages) {
      urls = webDetection.pagesWithMatchingImages.map(page => page.url).filter(Boolean);
    }
    visionResult = { success: true, links: [...new Set(urls)].slice(0, VISION_MAX_RESULTS) };
    console.log(`[Service] Google Vision scan completed in ${Date.now() - start}ms, found ${urls.length} links.`);
  } catch (err) {
    console.error('[Service] Google Vision API call failed:', err.message);
    if (err.code === 16) {
        console.error('[Service] FATAL: Google Vision Authentication failed! Please verify your key file and IAM role in GCP.');
    }
    visionResult = { success: false, links: [], error: err.message };
  }

  console.log(`[Service] Overall scan finished in ${Date.now() - overallStart}ms.`);

  return {
    tineye: tineyeResult,
    vision: visionResult,
  };
}

module.exports = {
  infringementScan,
};
