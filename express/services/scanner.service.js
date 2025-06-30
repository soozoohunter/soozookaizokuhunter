// express/services/scanner.service.js (Final Robust Version)
const logger = require('../utils/logger');
const visionService = require('./vision.service');
const tinEyeService = require('./tineye.service');
const imageFetcher = require('./imageFetcher');
const fingerprintService = require('./fingerprintService');
const axios = require('axios'); // Needed for downloading images

async function performFullScan(options) {
    // **FIX**: Enhanced logging to show exactly what is received.
    logger.info('[Scanner Service] Received scan request with options:', { 
        hasBuffer: !!options.buffer, 
        bufferLength: options.buffer ? options.buffer.length : 'N/A',
        originalFingerprint: options.originalFingerprint 
    });

    // This is the check that was failing.
    if (!options.buffer || !Buffer.isBuffer(options.buffer) || options.buffer.length === 0) {
        throw new Error('A valid image buffer is required for a full scan.');
    }
    
    const { buffer, originalFingerprint } = options;

    if (!originalFingerprint) {
        throw new Error('Original image fingerprint is required for comparison.');
    }

    const startTime = Date.now();

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
    // Limit verification to avoid excessive requests, e.g., first 30 URLs.
    for (const url of uniqueUrls.slice(0, 30)) { 
        try {
            const imageUrlOnPage = await imageFetcher.getMainImageUrl(url);
            if (!imageUrlOnPage) {
                logger.warn(`[Scanner Service] Could not extract image URL from page: ${url}`);
                continue;
            }

            const imageResponse = await axios.get(imageUrlOnPage, { responseType: 'arraybuffer' });
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
            // Add a small delay to avoid rate-limiting
            await new Promise(resolve => setTimeout(resolve, 200)); 
        } catch (error) {
            logger.error(`[Scanner Service] Failed to verify URL ${url}: ${error.message}`);
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
