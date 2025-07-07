// express/services/scanner.service.js (錯誤處理增強版)
const visionService = require('./vision.service');
const tineyeService = require('./tineye.service');
const bingService = require('./bing.service');
const imageFetcher = require('../utils/imageFetcher');
const logger = require('../utils/logger');

const scanByImage = async (imageBuffer, options = {}) => {
    logger.info('[Scanner Service] Received scan request with options:', options);
    let allSources = new Set();
    let errors = [];

    logger.info('[Scanner Service] Step 1: Performing reverse image search with Google, TinEye, and Bing...');
    
    // 使用 Promise.allSettled 來確保所有搜尋都會執行，即使其中一個失敗
    const results = await Promise.allSettled([
        visionService.searchByBuffer(imageBuffer),
        tineyeService.searchByBuffer(imageBuffer),
        bingService.searchByBuffer(imageBuffer)
    ]);

    // 處理 Google Vision 結果
    if (results[0].status === 'fulfilled') {
        results[0].value.forEach(url => allSources.add(url));
    } else {
        errors.push({ source: 'Google Vision', reason: results[0].reason.message });
        logger.error('[Google Vision Service] Search failed:', results[0].reason);
    }

    // 處理 TinEye 結果
    if (results[1].status === 'fulfilled') {
        results[1].value.forEach(url => allSources.add(url));
    } else {
        errors.push({ source: 'TinEye', reason: results[1].reason.message });
        logger.error('[TinEye Service] Search failed:', results[1].reason);
    }

    // 處理 Bing Vision 結果
    if (results[2].status === 'fulfilled') {
        results[2].value.forEach(url => allSources.add(url));
    } else {
        errors.push({ source: 'Bing Vision', reason: results[2].reason.message });
        logger.error('[Bing Service] Search failed:', results[2].reason);
    }

    const uniqueUrls = Array.from(allSources);
    logger.info(`[Scanner Service] Found ${uniqueUrls.length} unique potential URLs from all sources.`);

    logger.info(`[Scanner Service] Step 2: Verifying ${uniqueUrls.length} matches in parallel...`);
    
    const verificationResults = await imageFetcher.verifyMatches(imageBuffer, uniqueUrls, options.fingerprint);
    
    logger.info(`[Scanner Service] Full scan completed. Found ${verificationResults.matches.length} verified matches.`);

    return {
        scan: {
            totalSources: uniqueUrls.length,
            totalMatches: verificationResults.matches.length,
            matches: verificationResults.matches,
        },
        // [新增] 將 API 錯誤一併回傳，方便記錄
        errors: errors
    };
};

module.exports = { scanByImage };
