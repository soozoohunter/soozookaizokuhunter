// express/services/rapidApiService.js (正確的服務骨架)
const axios = require('axios');
const logger = require('../utils/logger');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST; // e.g., social-media-video-downloader.p.rapidapi.com

const isEnabled = RAPIDAPI_KEY && RAPIDAPI_HOST;

if (isEnabled) {
    logger.info('[RapidAPI Service] Service is ENABLED.');
} else {
    logger.warn('[RapidAPI Service] Service is DISABLED due to missing RAPIDAPI_KEY or RAPIDAPI_HOST.');
}

/**
 * 使用 RapidAPI 進行社群媒體搜尋
 * @param {string} searchUrl - 要搜尋的目標 URL
 * @returns {Promise<object>}
 */
async function searchSocialMedia(searchUrl) {
    if (!isEnabled) {
        return { success: false, results: [], error: 'RapidAPI Service is not configured.' };
    }

    // 範例：使用一個假設的社群媒體搜尋 API
    // 您需要根據您訂閱的實際 API 修改 url 和 params
    const options = {
        method: 'GET',
        url: `https://${RAPIDAPI_HOST}/api/v1/search`, // 範例 URL
        params: { url: searchUrl },      // 範例參數
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
        }
    };

    logger.info(`[RapidAPI Service] Sending request to ${options.url}`);

    try {
        const response = await axios.request(options);
        const results = response.data.results || [];
        logger.info(`[RapidAPI Service] Search successful. Found ${results.length} results.`);
        return { success: true, results, error: null };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        logger.error(`[RapidAPI Service] Search failed: ${errorMsg}`);
        return { success: false, results: [], error: errorMsg };
    }
}

module.exports = {
    searchSocialMedia,
};
