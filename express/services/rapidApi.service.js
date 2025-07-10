// express/services/rapidApi.service.js (已整合 Global Image Search)
const axios = require('axios');
const logger = require('../utils/logger');

const {
    RAPIDAPI_KEY,
    RAPIDAPI_YOUTUBE_URL,
    RAPIDAPI_TIKTOK_URL,
    RAPIDAPI_INSTAGRAM_URL,
    RAPIDAPI_FACEBOOK_URL,
    RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL // 讀取新的設定
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
        method: 'GET',
        url: RAPIDAPI_YOUTUBE_URL,
        host: getHostFromUrl(RAPIDAPI_YOUTUBE_URL),
        params: (keyword) => ({ keyword: keyword }),
        parse: (data) => {
            if (typeof data === 'object' && data !== null) {
                return Object.values(data).map(videoId => 
                    typeof videoId === 'string' ? `https://www.youtube.com/watch?v=$${videoId}` : null
                );
            }
            return [];
        }
    },
    GlobalImageSearch: {
        method: 'POST',
        url: RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL,
        host: getHostFromUrl(RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL),
        data: (keyword) => ({ keywords: keyword, count: "20" }),
        parse: (data) => data?.results?.map(item => item.url)
    },
    TikTok: { method: 'GET', url: RAPIDAPI_TIKTOK_URL, host: getHostFromUrl(RAPIDAPI_TIKTOK_URL), params: (keyword) => ({ keywords: keyword }), parse: (data) => data?.data?.videos?.map(item => item.play) },
    Instagram: { method: 'GET', url: RAPIDAPI_INSTAGRAM_URL, host: getHostFromUrl(RAPIDAPI_INSTAGRAM_URL), params: (keyword) => ({ query: keyword }), parse: (data) => data?.data?.map(item => item.post_url) },
    Facebook: { method: 'GET', url: RAPIDAPI_FACEBOOK_URL, host: getHostFromUrl(RAPIDAPI_FACEBOOK_URL), params: (keyword) => ({ q: keyword }), parse: (data) => data?.videos?.map(item => item.url) }
};

async function makeRequest(platform, keyword) {
    const config = API_CONFIGS[platform];
    if (!RAPIDAPI_KEY || !config?.url || !config?.host) {
        const warningMsg = `[RapidAPI][${platform}] Search skipped. API Key or URL for this platform is not configured in .env.`;
        logger.warn(warningMsg);
        return { success: true, links: [], error: `Service not configured for ${platform}` };
    }

    logger.info(`[RapidAPI][${platform}] Searching with keyword: "${keyword}"`);

    try {
        const requestOptions = {
            method: config.method,
            url: config.url,
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': config.host },
            timeout: 20000 
        };

        if (config.method === 'GET') {
            requestOptions.params = config.params(keyword);
        } else if (config.method === 'POST') {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.data = config.data(keyword);
        }

        const response = await axios.request(requestOptions);

        const links = config.parse(response.data)?.filter(Boolean) || [];
        const uniqueLinks = [...new Set(links)];
        
        logger.info(`[RapidAPI][${platform}] Search successful, found ${uniqueLinks.length} unique links.`);
        return { success: true, links: uniqueLinks, error: null };

    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        logger.error(`[RapidAPI][${platform}] Request failed: ${errorMsg}`, { status: err.response?.status });
        return { success: false, links: [], error: errorMsg };
    }
}

module.exports = {
    youtubeSearch: (keyword) => makeRequest('YouTube', keyword),
    tiktokSearch: (keyword) => makeRequest('TikTok', keyword),
    instagramSearch: (keyword) => makeRequest('Instagram', keyword),
    facebookSearch: (keyword) => makeRequest('Facebook', keyword),
    globalImageSearch: (keyword) => makeRequest('GlobalImageSearch', keyword)
};
