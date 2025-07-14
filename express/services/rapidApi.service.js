const axios = require('axios');
const logger = require('../utils/logger');

const { 
    RAPIDAPI_KEY, 
    RAPIDAPI_YOUTUBE_URL, RAPIDAPI_YOUTUBE_HOST,
    RAPIDAPI_TIKTOK_URL, RAPIDAPI_TIKTOK_HOST,
    RAPIDAPI_INSTAGRAM_URL, RAPIDAPI_INSTAGRAM_HOST,
    RAPIDAPI_FACEBOOK_URL, RAPIDAPI_FACEBOOK_HOST,
    RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL, RAPIDAPI_GLOBAL_IMAGE_SEARCH_HOST
} = process.env;

const API_CONFIGS = {
    youtube: {
        enabled: !!(RAPIDAPI_YOUTUBE_URL && RAPIDAPI_YOUTUBE_HOST),
        method: 'GET',
        url: RAPIDAPI_YOUTUBE_URL,
        host: RAPIDAPI_YOUTUBE_HOST,
        params: (keyword) => ({ q: keyword, part: 'snippet', maxResults: '25' }),
        parse: (data) => data?.items?.map(item => `https://www.youtube.com/watch?v=${item.id.videoId}`).filter(Boolean) || []
    },
    tiktok: {
        enabled: !!(RAPIDAPI_TIKTOK_URL && RAPIDAPI_TIKTOK_HOST),
        method: 'GET',
        url: RAPIDAPI_TIKTOK_URL,
        host: RAPIDAPI_TIKTOK_HOST,
        params: (keyword) => ({ keywords: keyword, count: 20 }),
        parse: (data) => data?.videos?.map(item => item.video_url).filter(Boolean) || []
    },
    instagram: {
        enabled: !!(RAPIDAPI_INSTAGRAM_URL && RAPIDAPI_INSTAGRAM_HOST),
        method: 'GET',
        url: RAPIDAPI_INSTAGRAM_URL,
        host: RAPIDAPI_INSTAGRAM_HOST,
        params: (keyword) => ({ query: keyword }),
        parse: (data) => data?.posts?.map(item => item.post_url).filter(Boolean) || []
    },
    facebook: {
        enabled: !!(RAPIDAPI_FACEBOOK_URL && RAPIDAPI_FACEBOOK_HOST),
        method: 'GET',
        url: RAPIDAPI_FACEBOOK_URL,
        host: RAPIDAPI_FACEBOOK_HOST,
        params: (keyword) => ({ q: keyword }),
        parse: (data) => data?.results?.map(item => item.url).filter(Boolean) || []
    },
    globalImage: {
        enabled: !!(RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL && RAPIDAPI_GLOBAL_IMAGE_SEARCH_HOST),
        method: 'GET',
        url: RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL,
        host: RAPIDAPI_GLOBAL_IMAGE_SEARCH_HOST,
        params: (keyword) => ({ keywords: keyword, count: "30" }),
        parse: (data) => data?.results?.map(item => item.url).filter(Boolean) || []
    }
};

async function searchPlatform(platform, keyword) {
    const config = API_CONFIGS[platform];

    if (!RAPIDAPI_KEY || !config || !config.enabled) {
        logger.info(`[RapidAPI][${platform}] Service is disabled or not configured in .env`);
        return [];
    }

    logger.info(`[RapidAPI][${platform}] Searching with keyword: "${keyword}"`);

    try {
        const requestOptions = {
            method: config.method,
            url: config.url,
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': config.host },
            timeout: 25000
        };

        if (config.method === 'GET' && config.params) {
            requestOptions.params = config.params(keyword);
        } else if (config.method === 'POST' && config.data) {
            requestOptions.data = config.data(keyword);
        }
        
        const response = await axios.request(requestOptions);
        const links = config.parse(response.data) || [];
        
        logger.info(`[RapidAPI][${platform}] Search successful, found ${links.length} potential links.`);
        return [...new Set(links)];

    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        logger.error(`[RapidAPI][${platform}] Request failed: ${errorMsg}`);
        throw new Error(`[${platform}] ${errorMsg}`);
    }
}

module.exports = {
    searchPlatform,
};
