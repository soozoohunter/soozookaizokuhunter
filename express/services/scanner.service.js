// express/services/scanner.service.js (with more input logging)
const logger = require('../utils/logger');
const visionService = require('./vision.service');
const tinEyeService = require('./tineye.service');
const imageFetcher = require('./imageFetcher');
const fingerprintService = require('./fingerprintService');
const axios = require('axios');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function performFullScan(options) {
    const startTime = Date.now();
    
    // **FIX**: Log the received options object immediately
    logger.info('[Scanner Service] Received scan request. Options:', { 
        hasOptions: !!options,
        hasBuffer: !!options?.buffer,
        bufferLength: options?.buffer?.length,
        hasFingerprint: !!options?.originalFingerprint
    });

    // It's good practice to check if options itself is valid
    if (!options) {
        throw new Error('Options object is required for a full scan.');
    }

    const { buffer, originalFingerprint } = options;

    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error('A valid image buffer is required for a full scan.');
    }
    if (!originalFingerprint) {
        throw new Error('Original image fingerprint is required for comparison.');
    }

    logger.info('[Scanner Service] Step 1: Performing reverse image search with Google Vision and TinEye...');
    const [visionResult, tineyeResult] = await Promise.all([
        visionService.searchByBuffer(buffer),
        tinEyeService.searchByBuffer(buffer)
    ]);

    const visionLinks = visionResult.success ? visionResult.links : [];
    const tineyeLinks = tineyeResult.success ? tineyeResult.matches.flatMap(m => m.backlinks.length > 0 ? m.backlinks : [m.url]) : [];
    
    const uniqueUrls = [...new Set([...visionLinks, ...tineyeLinks])];
    logger.info(`[Scanner Service] Found ${uniqueUrls.length} unique potential URLs.`);

    logger.info('[Scanner Service] Step 2: Verifying matches by fetching images and comparing fingerprints...');
    const verifiedMatches = [];
    for (const url of uniqueUrls.slice(0, 20)) {
        try {
            const imageUrlOnPage = await imageFetcher.getMainImageUrl(url);
            if (!imageUrlOnPage) {
                logger.warn(`[Scanner Service] Could not extract image URL from page, skipping: ${url}`);
                continue;
            }

            const imageResponse = await axios.get(imageUrlOnPage, { 
                responseType: 'arraybuffer',
                timeout: 15000
            });
            const downloadedImageBuffer = Buffer.from(imageResponse.data);
            
            const downloadedImageFingerprint = fingerprintService.sha256(downloadedImageBuffer);

            if (downloadedImageFingerprint === originalFingerprint) {
                logger.info(`[Scanner Service] CONFIRMED MATCH! Fingerprint matches at: ${url}`);
                verifiedMatches.push({
                    pageUrl: url,
                    imageUrl: imageUrlOnPage,
                    source: 'Verified Match',
                    fingerprintMatch: true
                });
            }
            await delay(200);
        } catch (error) {
            logger.error(`[Scanner Service] Failed to verify URL ${url}.`, { errorMessage: error.message, errorObj: error });
        }
    }

    const aggregatedResults = {
        reverseImageSearch: {
            googleVision: visionResult,
            tineye: tineyeResult,
            potentialUrlsFound: uniqueUrls.length
        },
        verifiedMatches: verifiedMatches,
    };
    
    const duration = Date.now() - startTime;
    logger.info(`[Scanner Service] Full scan completed in ${duration}ms. Found ${verifiedMatches.length} verified matches.`);
    return aggregatedResults;
}

module.exports = {
    performFullScan,
};
