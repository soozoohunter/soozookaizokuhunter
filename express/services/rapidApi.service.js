// express/services/rapidApi.service.js (Final Refactored Version)
const axios = require('axios');
const logger = require('../utils/logger');

const { RAPIDAPI_KEY, TIKTOK_HOST, YOUTUBE_HOST, INSTAGRAM_HOST, FACEBOOK_HOST } = process.env;

async function makeRequest(platform, config) {
    const host = config.headers['X-RapidAPI-Host'];
    if (!RAPIDAPI_KEY || !host) {
        const errorMsg = `[RapidAPI][${platform}] API Key or Host is not configured.`;
        logger.warn(errorMsg);
        return { success: false, links: [], error: errorMsg };
    }

    const keyword = config.params.q || config.params.keywords || config.params.query;
    logger.info(`[RapidAPI][${platform}] Searching with keyword: "${keyword}"...`);
    
    try {
        const response = await axios.request({ ...config, timeout: 15000 });
        
        const items = response.data?.data?.items || response.data?.results?.items || response.data?.videos || response.data?.posts || response.data?.data || response.data?.results || response.data || [];
        if (!Array.isArray(items)) {
            logger.warn(`[RapidAPI][${platform}] Response data is not an array.`, items);
            return { success: true, links: [], error: null };
        }
        
        const links = items.map(item => {
            if (!item) return null;
            let url = item.link || item.url || item.play || item.post_url || item.web_link;
            if (!url && platform === 'YouTube' && item.id?.videoId) {
                return `https://www.youtube.com/watch?v=${item.id.videoId}`;
            }
            if (url && typeof url === 'string' && url.startsWith('http')) {
                return url;
            }
            return null;
        }).filter(Boolean);

        logger.info(`[RapidAPI][${platform}] Search successful, found ${links.length} links.`);
        return { success: true, links, error: null };

    } catch (err) {
        const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
        logger.error(`[RapidAPI][${platform}] Request failed: ${errorMsg}`);
        return { success: false, links: [], error: errorMsg };
    }
}

// 【關鍵修正】為 Instagram 和 Facebook 使用更可能正確的端點路徑
const tiktokSearch = (keyword) => makeRequest('TikTok', {
    method: 'GET', url: `https://${TIKTOK_HOST}/feed/search`, params: { keywords: keyword, count: '10' }, headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': TIKTOK_HOST }
});

const youtubeSearch = (keyword) => makeRequest('YouTube', {
    method: 'GET', url: `https://${YOUTUBE_HOST}/search`, params: { q: keyword, maxResults: '10' }, headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': YOUTUBE_HOST }
});

const instagramSearch = (keyword) => makeRequest('Instagram', {
    method: 'GET', url: `https://${INSTAGRAM_HOST}/search/posts`, params: { query: keyword, count: '10' }, headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': INSTAGRAM_HOST }
});

const facebookSearch = (keyword) => makeRequest('Facebook', {
    method: 'GET', url: `https://${FACEBOOK_HOST}/search/posts`, params: { q: keyword, limit: '10' }, headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': FACEBOOK_HOST }
});

module.exports = { tiktokSearch, youtubeSearch, instagramSearch, facebookSearch };
