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

    // --- 步驟一：執行反向圖片搜尋 (採用版本二的 Promise.allSettled 穩健模式) ---
    const imageSearchPromises = [
        visionService.searchByBuffer(imageBuffer).then(res => ({ source: 'vision', data: res })),
        tinEyeService.searchByBuffer(imageBuffer).then(res => ({ source: 'tineye', data: res })),
        // bingService.searchByBuffer(imageBuffer).then(res => ({ source: 'bing', data: res })) // 如需使用 Bing，請取消此行註解
    ];

    const searchResults = await Promise.allSettled(imageSearchPromises);

    // --- 步驟二：整理圖片搜尋結果 (採用版本一的清晰資料結構) ---
    searchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            const { source, data } = result.value;
            if (data && data.success) {
                // 將所有找到的連結統一放入 'links' 陣列，確保格式一致
                results[source] = { 
                    success: true, 
                    links: data.links || [] 
                };
            } else if (data) {
                errors.push({ source, reason: data.error || 'API returned failure.' });
            }
        } else if (result.status === 'rejected') {
            errors.push({ source: 'unknown', reason: result.reason?.message || 'A search promise was rejected.' });
        }
    });

    // --- 步驟三：執行關鍵字搜尋 (保留版本二的擴展性) ---
    // const { keywords } = options;
    // if (keywords && keywords.trim() !== '') {
    //     logger.info(`[Scanner Service] Performing keyword searches for: "${keywords}"`);
    //     // ... 此處可添加呼叫 RapidAPI 的邏輯 ...
    // }

    // ★★★ 核心修正：移除導致「無結果」的二次驗證步驟 ★★★
    // 說明：此步驟會嘗試下載圖片進行二次比對，但常因網站反爬蟲而失敗。
    // 移除此步驟可確保所有初步找到的疑似連結都被回傳，解決核心問題。
    /*
    const allLinks = Object.values(results).flatMap(source => source.links).filter(Boolean);
    const uniqueLinks = [...new Set(allLinks)];
    if (uniqueLinks.length > 0) {
        try {
            const verification = await verifyMatches(imageBuffer, uniqueLinks, options.fingerprint);
        } catch (err) {
            errors.push({ source: 'verification', reason: err.message });
        }
    }
    */

    logger.info(`[Scanner Service] Full scan completed. Found results from ${Object.keys(results).length} sources.`);
    if (errors.length > 0) {
        logger.warn('[Scanner Service] Some APIs failed during scan:', errors);
    }

    // ★★★ 最終回傳整合後的 results 和 errors，格式與前端完全兼容 ★★★
    return {
        results,
        errors
    };
};

module.exports = {
    scanByImage,
};
