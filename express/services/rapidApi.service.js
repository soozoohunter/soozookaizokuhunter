// express/services/rapidApi.service.js (Final Refactored Version)
const axios = require('axios');
const logger = require('../utils/logger');

// 從環境變數讀取設定
const {
    RAPIDAPI_KEY,
    TIKTOK_HOST,
    YOUTUBE_HOST,
    INSTAGRAM_HOST,
    FACEBOOK_HOST
} = process.env;

/**
 * 統一的 RapidAPI 請求函式
 * @param {string} platform - 平台名稱 (例如 'TikTok', 'YouTube') 用於日誌記錄
 * @param {object} config - Axios 請求的設定物件
 * @returns {Promise<{success: boolean, links: string[], error: string|null}>}
 */
async function makeRequest(platform, config) {
    const host = config.headers['X-RapidAPI-Host'];
    
    // 檢查 API 金鑰和主機是否已設定
    if (!RAPIDAPI_KEY || !host) {
        const errorMsg = `[RapidAPI][${platform}] API Key or Host is not configured in .env.`;
        logger.warn(errorMsg);
        return { success: false, links: [], error: errorMsg };
    }

    const keyword = config.params.q || config.params.keywords || config.params.query;
    logger.info(`[RapidAPI][${platform}] Searching with keyword: "${keyword}"...`);
    
    try {
        const response = await axios.request({ ...config, timeout: 15000 }); // 統一設定15秒超時
        
        // --- 數據提取邏輯 ---
        // 應對不同 API 可能的回應格式
        const items = response.data?.data?.items || // Facebook (可能)
                      response.data?.results?.items || // YouTube (另一種格式)
                      response.data?.videos || // TikTok
                      response.data?.posts || // Instagram
                      response.data?.data || // 通用備援
                      response.data?.results || // 通用備援
                      response.data || // 最後備援
                      [];

        if (!Array.isArray(items)) {
            logger.warn(`[RapidAPI][${platform}] Response data is not an array.`, items);
            return { success: true, links: [], error: null };
        }
        
        const links = items
            .map(item => {
                if (!item) return null;
                // 優先使用明確的連結欄位
                let url = item.link || item.url || item.play || item.post_url || item.web_link;
                
                // 特殊處理 YouTube 的 videoId 物件
                if (!url && platform === 'YouTube' && item.id?.videoId) {
                    return `https://www.youtube.com/watch?v=${item.id.videoId}`;
                }

                if (url && typeof url === 'string' && url.startsWith('http')) {
                    return url;
                }
                return null;
            })
            .filter(Boolean); // 過濾掉所有 null 或無效的結果

        logger.info(`[RapidAPI][${platform}] Search successful, found ${links.length} links.`);
        return { success: true, links, error: null };

    } catch (err) {
        const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
        logger.error(`[RapidAPI][${platform}] Request failed: ${errorMsg}`);
        return { success: false, links: [], error: errorMsg };
    }
}

// 各平台的搜尋函式現在只是對 makeRequest 的簡單封裝
const tiktokSearch = (keyword) => makeRequest('TikTok', {
    method: 'GET',
    url: `https://${TIKTOK_HOST}/feed/search`,
    params: { keywords: keyword, count: '10' },
    headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': TIKTOK_HOST }
});

const youtubeSearch = (keyword) => makeRequest('YouTube', {
    method: 'GET',
    url: `https://${YOUTUBE_HOST}/search`,
    params: { q: keyword, maxResults: '10' },
    headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': YOUTUBE_HOST }
});

const instagramSearch = (keyword) => makeRequest('Instagram', {
    method: 'GET',
    url: `https://${INSTAGRAM_HOST}/search`,
    params: { query: keyword, count: '10' },
    headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': INSTAGRAM_HOST }
});

const facebookSearch = (keyword) => makeRequest('Facebook', {
    method: 'GET',
    url: `https://${FACEBOOK_HOST}/search`,
    params: { query: keyword, limit: '10' },
    headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': FACEBOOK_HOST }
});

module.exports = {
    tiktokSearch,
    youtubeSearch,
    instagramSearch,
    facebookSearch,
};
