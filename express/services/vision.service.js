const { ImageAnnotatorClient } = require('@google-cloud/vision');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

let visionClient = null;
// ★★★ 關鍵修正：將結果上限從預設值調整為 50 ★★★
const VISION_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

function initClient() {
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join('/app/credentials', 'gcp-vision.json');
    if (!fs.existsSync(keyFilename)) {
        logger.error(`[Vision Service] FATAL ERROR: Google Vision API credentials file not found at ${keyFilename}. Vision service will be disabled.`);
        return;
    }
    try {
        visionClient = new ImageAnnotatorClient({ keyFilename });
        logger.info('[Service] Google Vision Client initialized successfully.');
    } catch (error) {
        logger.error('[Vision Service] Failed to initialize Google Vision Client. It will be disabled.', error);
        visionClient = null;
    }
}

initClient();

function isInitialized() {
    return !!visionClient;
}

async function searchByBuffer(buffer) {
    if (!visionClient) {
        logger.warn('[Vision Service] Client not initialized. Skipping Google Vision search.');
        return { success: false, links: [], error: 'Vision client not initialized.' };
    }
    if (!buffer || buffer.length === 0) {
        logger.error('[Vision Service] searchByBuffer called with an invalid buffer.');
        return { success: false, links: [], error: 'Image buffer is required.' };
    }

    try {
        const [result] = await visionClient.webDetection({ image: { content: buffer } });
        const webDetection = result.webDetection;
        let urls = [];
        if (webDetection?.pagesWithMatchingImages) {
            urls = webDetection.pagesWithMatchingImages.map(page => page.url).filter(Boolean);
        }
        
        // ★★★ 使用新的上限值來擷取結果 ★★★
        const uniqueUrls = [...new Set(urls)].slice(0, VISION_MAX_RESULTS);
        logger.info(`[Vision Service] Search by buffer successful, found ${uniqueUrls.length} links.`);
        return { success: true, links: uniqueUrls, error: null };
    } catch (err) {
        logger.error(`[Vision Service] Google Vision API call failed: ${err.message}`);
        return { success: false, links: [], error: err.message };
    }
}

module.exports = {
    searchByBuffer,
    isInitialized,
};
