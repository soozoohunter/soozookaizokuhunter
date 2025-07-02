// express/services/vectorSearch.js (最終棄用版)
const logger = require('../utils/logger');

// 檢查環境變數，如果設為 true，則此服務下的所有功能都將被停用。
const VECTOR_DISABLED = process.env.DISABLE_VECTOR_SEARCH === 'true';

/**
 * 索引圖片的空操作版本。
 * 直接在函式開頭檢查停用標記。
 */
const indexImage = async (fileBuffer, fileId) => {
    if (VECTOR_DISABLED) {
        logger.warn(`[vectorSearchService-DISABLED] indexImage called for File ID: ${fileId}. Service is disabled, skipping.`);
        return Promise.resolve();
    }
    logger.warn(`[vectorSearchService] indexImage called but no vector service is configured.`);
    return Promise.resolve();
};

/**
 * 本地圖片搜尋的空操作版本。
 * 直接在函式開頭檢查停用標記，並返回一個無害的空結果。
 */
const searchLocalImage = async (imageBuffer) => {
    if (VECTOR_DISABLED) {
        logger.warn('[vectorSearchService-DISABLED] searchLocalImage called. Service is disabled, skipping. Returning empty results.');
        return Promise.resolve({ success: true, matches: [] });
    }
    logger.warn(`[vectorSearchService] searchLocalImage called but no vector service is configured. Returning empty results.`);
    return Promise.resolve({ success: true, matches: [] });
};

module.exports = {
    indexImage,
    searchLocalImage,
};
