// express/services/tineye.service.js
const TinEye = require('tineye-api');
const logger = require('../utils/logger');

const TINEYE_PUBLIC_KEY = process.env.TINEYE_PUBLIC_KEY;
const TINEYE_PRIVATE_KEY = process.env.TINEYE_PRIVATE_KEY;
const TINEYE_API_URL = 'https://api.tineye.com/rest/';

let api;
// Initialize the client only if both keys are present
if (TINEYE_PRIVATE_KEY && TINEYE_PUBLIC_KEY) {
    api = new TinEye(TINEYE_API_URL, TINEYE_PUBLIC_KEY, TINEYE_PRIVATE_KEY);
} else {
    logger.warn('[TinEye Service] TINEYE_PUBLIC_KEY or TINEYE_PRIVATE_KEY is not configured in .env file. Service will be disabled.');
}

function isInitialized() {
    return !!api;
}

/**
 * Searches for matches using the TinEye API with a given image buffer.
 * @param {Buffer} buffer - The image file buffer.
 * @returns {Promise<object>} - An object containing the scan results.
 */
async function searchByBuffer(buffer) {
    if (!api) {
        return { success: false, links: [], error: 'TinEye Service is not configured.' };
    }
    if (!buffer || buffer.length === 0) {
        logger.error('[TinEye Service] searchByBuffer was called with an empty or invalid buffer.');
        return { success: false, links: [], error: 'Invalid image buffer provided.' };
    }

    logger.info(`[TinEye Service] Starting search by image buffer (size: ${buffer.length} bytes)...`);

    try {
        const response = await api.searchData(buffer);
        const rawMatches = response.results?.matches || [];
        
        // ★★★ 關鍵修正：將回傳的 'matches' 整理成 'links' 陣列 ★★★
        const allUrls = [];
        rawMatches.forEach(match => {
            // 添加 TinEye 找到的比對圖片來源網頁
            if (match.image_url) {
                allUrls.push(match.image_url);
            }
            // 添加所有反向連結的網頁
            if (Array.isArray(match.backlinks)) {
                match.backlinks.forEach(link => {
                    if (link.url) {
                        allUrls.push(link.url);
                    }
                });
            }
        });

        // 移除重複的 URL，確保陣列乾淨
        const uniqueLinks = [...new Set(allUrls)];

        logger.info(`[TinEye Service] Search complete. Found ${uniqueLinks.length} unique URLs.`);
        
        // 為了與 vision.service 統一，回傳 'links' 屬性
        return { success: true, links: uniqueLinks, error: null };

    } catch (error) {
        logger.error('[TinEye Service] Search failed:', error);
        // 同樣，錯誤時也回傳 links 屬性
        return { success: false, links: [], error: error.message || 'An unknown error occurred during TinEye search.' };
    }
}

module.exports = {
    searchByBuffer,
    isInitialized,
};
