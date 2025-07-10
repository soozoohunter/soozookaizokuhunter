// express/services/scanner.service.js (已整合 imageFetcher)
const visionService = require('./vision.service');
const tineyeService = require('./tineye.service');
const bingService = require('./bing.service');
const rapidApiService = require('./rapidApi.service'); 
const imageFetcher = require('../utils/imageFetcher'); // 引入我們的新工具
const logger = require('../utils/logger');

const scanByImage = async (imageBuffer, options = {}) => {
    logger.info('[Scanner Service] Received scan request with options:', options);
    let allSources = new Set();
    let errors = [];
    const { keywords, fingerprint } = options; // 確保傳入 fingerprint

    if (!fingerprint) {
        logger.error('[Scanner Service] Critical error: original fingerprint is required for verification.');
        return { scan: {}, errors: [{ source: 'Internal', reason: 'Original fingerprint missing.' }]};
    }

    logger.info('[Scanner Service] Step 1: Performing reverse image search...');
    
    const searchPromises = [
        visionService.searchByBuffer(imageBuffer),
        tineyeService.searchByBuffer(imageBuffer),
        bingService.searchByBuffer(imageBuffer)
    ];

    if (keywords) {
        logger.info(`[Scanner Service] Step 2: Performing keyword search with: "${keywords}"`);
        searchPromises.push(rapidApiService.youtubeSearch(keywords));
        searchPromises.push(rapidApiService.globalImageSearch(keywords));
    }

    const results = await Promise.allSettled(searchPromises);

    const processResult = (result, sourceName) => {
        if (result.status === 'rejected') {
            errors.push({ source: sourceName, reason: result.reason?.message || 'Unknown rejection' });
            return;
        }
        if (!result.value?.success) {
            errors.push({ source: sourceName, reason: result.value?.error || 'API call failed' });
            return;
        }
        if (Array.isArray(result.value.links)) {
            result.value.links.forEach(url => allSources.add(url));
        }
    };

    let promiseIndex = 0;
    processResult(results[promiseIndex++], 'Google Vision');
    processResult(results[promiseIndex++], 'TinEye');
    processResult(results[promiseIndex++], 'Bing Vision');
    if (keywords) {
        processResult(results[promiseIndex++], 'YouTube');
        processResult(results[promiseIndex++], 'Global Image Search');
    }

    const uniqueUrls = Array.from(allSources);
    logger.info(`[Scanner Service] Found ${uniqueUrls.length} unique potential URLs from all sources.`);

    // [核心修正] 確保 imageFetcher.verifyMatches 被正確呼叫
    logger.info(`[Scanner Service] Step 3: Verifying ${uniqueUrls.length} matches in parallel...`);
    const verificationResults = await imageFetcher.verifyMatches(imageBuffer, uniqueUrls, fingerprint);
    
    logger.info(`[Scanner Service] Full scan completed. Found ${verificationResults.matches.length} verified matches.`);
    
    // 將 API 呼叫的錯誤與驗證的錯誤合併
    const allErrors = [...errors, ...verificationResults.errors];

    return {
        scan: {
            totalSources: uniqueUrls.length,
            totalMatches: verificationResults.matches.length,
            matches: verificationResults.matches,
        },
        errors: allErrors
    };
};

module.exports = { scanByImage };
