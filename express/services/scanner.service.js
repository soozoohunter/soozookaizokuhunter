const logger = require('../utils/logger');
const visionService = require('./vision.service');
const tinEyeService = require('./tineye.service');
// 註：請確保您專案中存在以下服務檔案，並已正確配置 API Key
// const bingService = require('./bing.service');
// const { searchPlatform } = require('./rapidApi.service');
// const { verifyMatches } = require('../utils/imageFetcher');

/**
 * 執行基於圖片的反向搜圖和關鍵字搜尋
 * @param {Buffer} imageBuffer - 圖片的 Buffer
 * @param {object} options - 包含 fingerprint 和 keywords 的選項
 * @returns {Promise<object>} - 包含結果和錯誤的掃描報告
 */
const scanByImage = async (imageBuffer, options = {}) => {
    logger.info('[Scanner Service] Received scan request with options:', options);

    const results = {};
    const errors = [];

    // --- 步驟一：執行反向圖片搜尋 (穩健的並行處理) ---
    const imageSearchPromises = [];

    if (visionService.isInitialized()) {
        imageSearchPromises.push(
            visionService.searchByBuffer(imageBuffer)
                .then(res => ({ source: 'vision', data: res }))
                .catch(err => ({ source: 'vision', error: err }))
        );
    }
    if (tinEyeService.isInitialized()) {
        imageSearchPromises.push(
            tinEyeService.searchByBuffer(imageBuffer)
                .then(res => ({ source: 'tineye', data: res }))
                .catch(err => ({ source: 'tineye', error: err }))
        );
    }
    // if (bingService.isInitialized()) { ... } // 未來可擴充

    const imageSearchResults = await Promise.all(imageSearchPromises);

    // 整理圖片搜尋結果
    imageSearchResults.forEach(result => {
        if (result.error) {
            errors.push({ source: result.source, message: result.error.message });
            return;
        }
        if (result.data && result.data.success && Array.isArray(result.data.links)) {
            results[result.source] = {
                success: true,
                links: result.data.links
            };
        }
    });

    // --- 步驟二：執行關鍵字搜尋 (未來擴展) ---
    // const { keywords } = options;
    // if (keywords) {
    //     logger.info(`[Scanner Service] Performing keyword searches for: "${keywords}"`);
    //     // ... 此處可添加呼叫 RapidAPI 的邏輯 ...
    // }
    
    // --- (暫停) 步驟三：二次驗證 ---
    // 說明：此步驟因網站反爬蟲而不可靠，暫時停用以確保所有找到的疑似連結都被回傳。
    /*
    const allLinks = Object.values(results).flatMap(source => source.links).filter(Boolean);
    const uniqueLinks = [...new Set(allLinks)];
    if (uniqueLinks.length > 0) {
       const verification = await verifyMatches(imageBuffer, uniqueLinks, options.fingerprint);
    }
    */

    logger.info(`[Scanner Service] Full scan completed. Found results from ${Object.keys(results).length} sources.`);
    if(errors.length > 0) {
        logger.warn('[Scanner Service] Some APIs failed during scan:', errors);
    }

    return { results, errors };
};

module.exports = {
    scanByImage,
};
