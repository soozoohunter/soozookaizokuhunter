// express/services/rapidApi.service.js (Final Configurable Version)
const axios = require('axios');
const logger = require('../utils/logger');

const {
    RAPIDAPI_KEY,
    RAPIDAPI_YOUTUBE_URL,
    RAPIDAPI_TIKTOK_URL,
    RAPIDAPI_INSTAGRAM_URL,
    RAPIDAPI_FACEBOOK_URL
} = process.env;

const getHostFromUrl = (url) => {
    try {
        if (!url) return null;
        return new URL(url).hostname;
    } catch (e) {
        logger.error(`[RapidAPI] Invalid URL in .env file: ${url}`);
        return null;
    }
};

const API_CONFIGS = {
    YouTube: {
        url: RAPIDAPI_YOUTUBE_URL,
        host: getHostFromUrl(RAPIDAPI_YOUTUBE_URL),
        params: (keyword) => ({ q: keyword, hl: 'en', gl: 'US' })
    },
    TikTok: {
        url: RAPIDAPI_TIKTOK_URL,
        host: getHostFromUrl(RAPIDAPI_TIKTOK_URL),
        params: (keyword) => ({ keywords: keyword, count: 10 })
    },
    Instagram: {
        url: RAPIDAPI_INSTAGRAM_URL,
        host: getHostFromUrl(RAPIDAPI_INSTAGRAM_URL),
        params: (keyword) => ({ query: keyword })
    },
    Facebook: {
        url: RAPIDAPI_FACEBOOK_URL,
        host: getHostFromUrl(RAPIDAPI_FACEBOOK_URL),
        params: (keyword) => ({ query: keyword })
    }
};

async function makeRequest(platform, keyword) {
    const config = API_CONFIGS[platform];
    if (!RAPIDAPI_KEY || !config.url || !config.host) {
        const errorMsg = `[RapidAPI][${platform}] API Key, URL, or Host is not configured in .env file. Please check your .env configuration.`;
        logger.warn(errorMsg);
        return { success: false, links: [], error: errorMsg };
    }

    logger.info(`[RapidAPI][${platform}] Searching with keyword: "${keyword}" at endpoint: ${config.url}`);

    try {
        const response = await axios.request({
            method: 'GET',
            url: config.url,
            params: config.params(keyword),
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': config.host },
            timeout: 15000
        });

        const items = response.data?.data?.items || response.data?.results?.items || response.data?.videos || response.data?.posts || response.data?.data || response.data?.results || response.data?.items || response.data || [];

        if (!Array.isArray(items)) {
            logger.warn(`[RapidAPI][${platform}] Response data is not an array. Full response data:`, response.data);
            return { success: true, links: [], error: 'Response data is not an array' };
        }

        const links = items.map(item => {
            if (!item) return null;
            let itemUrl = item.link || item.url || item.play || item.post_url || item.web_link || item.media_url;
            if (!itemUrl && platform === 'YouTube' && item.video?.videoId) {
                return `https://www.youtube.com/watch?v=${item.video.videoId}`;
            }
            if (itemUrl && typeof itemUrl === 'string' && itemUrl.startsWith('http')) {
                return itemUrl;
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

module.exports = {
    tiktokSearch: (keyword) => makeRequest('TikTok', keyword),
    youtubeSearch: (keyword) => makeRequest('YouTube', keyword),
    instagramSearch: (keyword) => makeRequest('Instagram', keyword),
    facebookSearch: (keyword) => makeRequest('Facebook', keyword)
};
