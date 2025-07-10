// express/services/scanner.service.js (錯誤處理與日誌增強版)
const visionService = require('./vision.service');
const tineyeService = require('./tineye.service');
const bingService = require('./bing.service');
const rapidApiService = require('./rapidApi.service');
const imageFetcher = require('../utils/imageFetcher');
const logger = require('../utils/logger');

const scanByImage = async (imageBuffer, options = {}) => {
    logger.info('[Scanner Service] Received scan request with options:', options);
    let allSources = new Set();
    let errors = [];
    const { keywords } = options;

    logger.info('[Scanner Service] Step 1: Performing reverse image search...');
    
    const searchPromises = [
        visionService.searchByBuffer(imageBuffer),
        tineyeService.searchByBuffer(imageBuffer),
        bingService.searchByBuffer(imageBuffer)
    ];

    if (keywords) {
        logger.info(`[Scanner Service] Step 2: Performing keyword search on social media with: "${keywords}"`);
        searchPromises.push(rapidApiService.youtubeSearch(keywords));
        searchPromises.push(rapidApiService.tiktokSearch(keywords));
        searchPromises.push(rapidApiService.instagramSearch(keywords));
    }

    const results = await Promise.allSettled(searchPromises);

    // [核心修正] 重新設計的、更穩健的結果處理函式
    const processResult = (result, sourceName) => {
        // 情況 1: Promise 被拒絕 (例如網路超時)
        if (result.status === 'rejected') {
            const reason = result.reason?.message || 'Unknown rejection reason';
            errors.push({ source: sourceName, reason });
            logger.error(`[Scanner][${sourceName}] Search rejected:`, reason);
            return;
        }
        
        // 情況 2: Promise 已完成，但 API 回傳失敗
        if (!result.value || !result.value.success) {
            const reason = result.value?.error || 'API returned failure but no error message.';
            errors.push({ source: sourceName, reason });
            logger.error(`[Scanner][${sourceName}] Search failed:`, reason);
            return;
        }
        
        // 情況 3: 成功
        if (Array.isArray(result.value.links)) {
            result.value.links.forEach(url => allSources.add(url));
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

    logger.info(`[Scanner Service] Verifying ${uniqueUrls.length} matches...`);
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
