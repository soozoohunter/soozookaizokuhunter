// express/services/scanner.service.js (錯誤處理與日誌增強版)
const visionService = require('./vision.service');
const tineyeService = require('./tineye.service');
const bingService = require('./bing.service');
const rapidApiService = require('./rapidApi.service'); // 引入 RapidAPI 服務
const imageFetcher = require('../utils/imageFetcher');
const logger = require('../utils/logger');

const scanByImage = async (imageBuffer, options = {}) => {
    logger.info('[Scanner Service] Received scan request with options:', options);
    let allSources = new Set();
    let errors = [];
    const { keywords } = options; // 假設 options 中會傳入關鍵字

    logger.info('[Scanner Service] Step 1: Performing reverse image search...');
    
    // 使用 Promise.allSettled 來確保所有搜尋都會執行，即使其中一個失敗
    const imageSearchPromises = [
        visionService.searchByBuffer(imageBuffer),
        tineyeService.searchByBuffer(imageBuffer),
        bingService.searchByBuffer(imageBuffer)
    ];

    // 如果有關鍵字，才執行 RapidAPI 搜尋
    if (keywords) {
        logger.info(`[Scanner Service] Step 2: Performing keyword search on social media with: "${keywords}"`);
        imageSearchPromises.push(rapidApiService.youtubeSearch(keywords));
        imageSearchPromises.push(rapidApiService.tiktokSearch(keywords));
        imageSearchPromises.push(rapidApiService.instagramSearch(keywords));
        // Facebook API 可能限制較多，可選擇性啟用
        // imageSearchPromises.push(rapidApiService.facebookSearch(keywords));
    }

    const results = await Promise.allSettled(imageSearchPromises);

    const processResult = (result, sourceName) => {
        if (result.status === 'fulfilled' && result.value.success) {
            result.value.links.forEach(url => allSources.add(url));
        } else {
            const reason = result.reason?.message || result.value?.error || 'Unknown error';
            errors.push({ source: sourceName, reason });
            logger.error(`[Scanner][${sourceName}] Search failed:`, reason);
        }
    };

    processResult(results[0], 'Google Vision');
    processResult(results[1], 'TinEye');
    processResult(results[2], 'Bing Vision');
    if (keywords) {
        processResult(results[3], 'YouTube');
        processResult(results[4], 'TikTok');
        processResult(results[5], 'Instagram');
    }

    const uniqueUrls = Array.from(allSources);
    logger.info(`[Scanner Service] Found ${uniqueUrls.length} unique potential URLs from all sources.`);

    // [可選] 如果不需要對每個連結進行二次驗證，可以直接回傳結果
    // logger.info(`[Scanner Service] Full scan completed.`);
    // return {
    //     scan: {
    //         totalSources: uniqueUrls.length,
    //         totalMatches: uniqueUrls.length,
    //         matches: uniqueUrls.map(url => ({ url, similarity: 'N/A', source: 'API Search' })),
    //     },
    //     errors: errors
    // };

    // 如果需要二次驗證 (例如比對圖片相似度)
    logger.info(`[Scanner Service] Step 3: Verifying ${uniqueUrls.length} matches in parallel...`);
    const verificationResults = await imageFetcher.verifyMatches(imageBuffer, uniqueUrls, options.fingerprint);
    logger.info(`[Scanner Service] Full scan completed. Found ${verificationResults.matches.length} verified matches.`);

    return {
        scan: {
            totalSources: uniqueUrls.length,
            totalMatches: verificationResults.matches.length,
            matches: verificationResults.matches,
        },
        errors: errors
    };
};

module.exports = { scanByImage };
