// express/services/scanner.service.js (v3.2 - 穩定性優先版)
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
    const { keywords, fingerprint } = options;

    logger.info('[Scanner Service] Step 1: Performing reverse image and keyword search...');
    
    const searchPromises = [
        visionService.searchByBuffer(imageBuffer),
        tineyeService.searchByBuffer(imageBuffer),
        bingService.searchByBuffer(imageBuffer)
    ];

    if (keywords) {
        searchPromises.push(rapidApiService.youtubeSearch(keywords));
        searchPromises.push(rapidApiService.globalImageSearch(keywords));
    }

    const results = await Promise.allSettled(searchPromises);

    const processResult = (result, sourceName) => {
        if (result.status === 'rejected') {
            const reason = result.reason?.message || 'Unknown rejection reason';
            errors.push({ source: sourceName, reason });
            logger.error(`[Scanner][${sourceName}] Search rejected:`, reason);
            return;
        }
        if (!result.value || !result.value.success) {
            const reason = result.value?.error || 'API returned failure but no error message.';
            errors.push({ source: sourceName, reason });
            logger.error(`[Scanner][${sourceName}] Search failed:`, reason);
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

    // [穩定性修正] 為了確保您能看到初步的 API 掃描結果，我們先暫時註解掉二次驗證。
    // 這個步驟會去下載所有找到的圖片來比對，如果外部連結失效，可能會增加失敗率。
    // logger.info(`[Scanner Service] Step 2: Verifying ${uniqueUrls.length} matches in parallel...`);
    // const verificationResults = await imageFetcher.verifyMatches(imageBuffer, uniqueUrls, fingerprint);
    // logger.info(`[Scanner Service] Full scan completed. Found ${verificationResults.matches.length} verified matches.`);
    
    // 直接將 API 找到的連結作為初步結果回傳
    const preliminaryMatches = uniqueUrls.map(url => ({
        url: url,
        similarity: 'N/A (Verification Skipped)',
        source: 'API Search'
    }));

    return {
        scan: {
            totalSources: uniqueUrls.length,
            totalMatches: preliminaryMatches.length,
            matches: preliminaryMatches,
        },
        errors: errors
    };
};

module.exports = { scanByImage };
