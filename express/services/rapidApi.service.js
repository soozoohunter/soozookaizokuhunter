// express/services/rapidApi.service.js (合併並強化的最終版本)
const axios = require('axios');
const logger = require('../utils/logger');

const {
    RAPIDAPI_KEY,
    RAPIDAPI_YOUTUBE_URL,
    RAPIDAPI_TIKTOK_URL,
    RAPIDAPI_INSTAGRAM_URL,
    RAPIDAPI_FACEBOOK_URL
} = process.env;

// 從完整的 URL 中提取 host
const getHostFromUrl = (url) => {
    try {
        if (!url) return null;
        return new URL(url).hostname;
    } catch (e) {
        logger.error(`[RapidAPI] Invalid URL in .env file: ${url}`);
        return null;
    }
};

// 統一的 API 設定
const API_CONFIGS = {
    YouTube: {
        url: RAPIDAPI_YOUTUBE_URL,
        host: getHostFromUrl(RAPIDAPI_YOUTUBE_URL),
        params: (keyword) => ({ q: keyword, hl: 'en', gl: 'US' }),
        // 解析 YouTube 回應的函式
        parse: (data) => data?.contents?.map(item => item.video?.videoId ? `https://www.youtube.com/watch?v=$${item.video.videoId}` : null)
    },
    TikTok: {
        url: RAPIDAPI_TIKTOK_URL,
        host: getHostFromUrl(RAPIDAPI_TIKTOK_URL),
        params: (keyword) => ({ keywords: keyword, count: 20 }),
        // 解析 TikTok 回應的函式
        parse: (data) => data?.data?.videos?.map(item => item.play)
    },
    Instagram: {
        url: RAPIDAPI_INSTAGRAM_URL,
        host: getHostFromUrl(RAPIDAPI_INSTAGRAM_URL),
        params: (keyword) => ({ query: keyword }),
        // 解析 Instagram 回應的函式
        parse: (data) => data?.data?.map(item => item.post_url)
    },
    Facebook: {
        url: RAPIDAPI_FACEBOOK_URL,
        host: getHostFromUrl(RAPIDAPI_FACEBOOK_URL),
        params: (keyword) => ({ q: keyword }),
        // 解析 Facebook 回應的函式
        parse: (data) => data?.videos?.map(item => item.url)
    }
};

// 可重用的請求函式
async function makeRequest(platform, keyword) {
    const config = API_CONFIGS[platform];
    if (!RAPIDAPI_KEY || !config?.url || !config?.host) {
        const errorMsg = `[RapidAPI][${platform}] Service is disabled. Check RAPIDAPI_KEY and ${platform.toUpperCase()}_URL in .env.`;
        logger.warn(errorMsg);
        return { success: false, links: [], error: errorMsg };
    }

    logger.info(`[RapidAPI][${platform}] Searching with keyword: "${keyword}"`);

    try {
        const response = await axios.request({
            method: 'GET',
            url: config.url,
            params: config.params(keyword),
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': config.host },
            timeout: 20000 // 增加超時時間
        });

        // 使用對應的解析函式
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
    tiktokSearch: (keyword) => makeRequest('TikTok', keyword),
    youtubeSearch: (keyword) => makeRequest('YouTube', keyword),
    instagramSearch: (keyword) => makeRequest('Instagram', keyword),
    facebookSearch: (keyword) => makeRequest('Facebook', keyword)
};
