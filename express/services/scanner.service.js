const logger = require('../utils/logger');
const visionService = require('./vision.service');
const tinEyeService = require('./tineye.service');
const bingService = require('./bing.service.js');
const imageFetcher = require('./imageFetcher');
const fingerprintService = require('./fingerprintService');
const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function performFullScan(options) {
    logger.info('[Scanner Service] Received scan request with options:', { 
        hasBuffer: !!options.buffer, 
        bufferLength: options.buffer ? options.buffer.length : 'N/A',
        originalFingerprint: options.originalFingerprint 
    });

    if (!options.buffer || !Buffer.isBuffer(options.buffer) || options.buffer.length === 0) {
        throw new Error('A valid image buffer is required for a full scan.');
    }
    
    const { buffer, originalFingerprint } = options;
    if (!originalFingerprint) {
        throw new Error('Original image fingerprint is required for comparison.');
    }

    const startTime = Date.now();
    let browser = null; // Hold the single browser instance

    try {
        // --- Stage 1: Fast API-based reverse image search ---
        logger.info('[Scanner Service] Step 1: Performing reverse image search with Google, TinEye, and Bing...');
        const [visionResult, tineyeResult, bingResult] = await Promise.all([
            visionService.searchByBuffer(buffer),
            tinEyeService.searchByBuffer(buffer),
            bingService.searchByBuffer(buffer)
        ]);

        const visionLinks = visionResult.success ? visionResult.links : [];
        const tineyeLinks = tineyeResult.success ? tineyeResult.matches.flatMap(m => m.backlinks.length > 0 ? m.backlinks : [m.url]) : [];
        const bingLinks = bingResult.success ? bingResult.links : [];
        
        const uniqueUrls = [...new Set([...visionLinks, ...tineyeLinks, ...bingLinks])];
        logger.info(`[Scanner Service] Found ${uniqueUrls.length} unique potential URLs from all sources.`);

        if (uniqueUrls.length === 0) {
            logger.info('[Scanner Service] No potential URLs found. Skipping verification step.');
            // Return early if no links found
            return {
                reverseImageSearch: { googleVision: visionResult, tineye: tineyeResult, bing: bingResult, potentialUrlsFound: 0 },
                verifiedMatches: [],
            };
        }

        // --- Stage 2: Parallel verification of potential URLs ---
        logger.info(`[Scanner Service] Step 2: Verifying ${uniqueUrls.length} matches in parallel...`);
        
        // **OPTIMIZATION**: Launch one browser for all verification tasks.
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        });

        // **OPTIMIZATION**: Run verification tasks in parallel using Promise.allSettled
        const verificationPromises = uniqueUrls.slice(0, 30).map(async (url) => {
            try {
                const imageUrlOnPage = await imageFetcher.getMainImageUrl(url, browser);
                if (!imageUrlOnPage) return null;

                const imageResponse = await axios.get(imageUrlOnPage, { responseType: 'arraybuffer', timeout: 15000 });
                const downloadedImageBuffer = Buffer.from(imageResponse.data);
                
                const downloadedImageFingerprint = fingerprintService.sha256(downloadedImageBuffer);

                if (downloadedImageFingerprint === originalFingerprint) {
                    logger.info(`[Scanner Service] CONFIRMED MATCH! Fingerprint matches at: ${url}`);
                    return {
                        pageUrl: url,
                        imageUrl: imageUrlOnPage,
                        source: 'Verified Match',
                        fingerprintMatch: true
                    };
                }
                return null;
            } catch (error) {
                logger.error(`[Scanner Service] Failed to verify URL ${url}: ${error.message}`);
                return null;
            }
        });

        const results = await Promise.allSettled(verificationPromises);
        const verifiedMatches = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);
        
        const duration = Date.now() - startTime;
        logger.info(`[Scanner Service] Full scan completed in ${duration}ms. Found ${verifiedMatches.length} verified matches.`);
        
        return {
            reverseImageSearch: { googleVision: visionResult, tineye: tineyeResult, bing: bingResult, potentialUrlsFound: uniqueUrls.length },
            verifiedMatches,
        };
    } finally {
        // **OPTIMIZATION**: Ensure the single browser instance is always closed.
        if (browser) {
            await browser.close();
            logger.info('[Scanner Service] Browser instance closed.');
        }
    }
}

module.exports = {
    performFullScan,
};
