const { ImageAnnotatorClient } = require('@google-cloud/vision');
const logger = require('../utils/logger');
const tinEyeService = require('./tineye.service');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const visionClient = new ImageAnnotatorClient();
const VISION_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

logger.info('[Service] Google Vision Client initialized.');

async function searchByBuffer(buffer) {
    if (!buffer) {
        return { success: false, links: [], error: 'Image buffer is required.' };
    }

    try {
        const [result] = await visionClient.webDetection({ image: { content: buffer } });
        const webDetection = result.webDetection;
        let urls = [];
        if (Array.isArray(webDetection?.pagesWithMatchingImages)) {
            urls = webDetection.pagesWithMatchingImages.map(page => page.url).filter(Boolean);
        } else if (webDetection && webDetection.pagesWithMatchingImages) {
            logger.warn('[Vision Service] pagesWithMatchingImages is not array:', webDetection.pagesWithMatchingImages);
        }
        const uniqueUrls = [...new Set(urls)].slice(0, VISION_MAX_RESULTS);
        logger.info(`[Vision Service] Search by buffer successful, found ${uniqueUrls.length} links.`);
        return { success: true, links: uniqueUrls, error: null };
    } catch (err) {
        logger.error(`[Vision Service] API call failed: ${err.message}`, { code: err.code });
        if (err.code === 16) {
             logger.error('[Vision Service] FATAL: Authentication failed! Verify key file, IAM role, and GOOGLE_APPLICATION_CREDENTIALS path inside the container.');
        }
        return { success: false, links: [], error: err.message };
    }
}

async function infringementScan(buffer) {
    if (!buffer) {
        throw new Error('Image buffer is required for infringement scan');
    }

    // Directly send the buffer to TinEye instead of writing a temp file
    const tineyeResult = await tinEyeService.searchByBuffer(buffer);

    const visionResult = await searchByBuffer(buffer);

    return { tineye: tineyeResult, vision: visionResult };
}

module.exports = {
    searchByBuffer,
    infringementScan,
};
