// express/services/rapidApi.service.js (v3.0 - Direct Request)
const axios = require('axios');
const logger = require('../utils/logger');

const { RAPIDAPI_KEY, RAPIDAPI_YOUTUBE_URL, RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL } = process.env;

const getHostFromUrl = (url) => {
    try { return url ? new URL(url).hostname : null; } catch (e) { return null; }
};

const API_CONFIGS = {
    YouTube: {
        method: 'GET',
        url: RAPIDAPI_YOUTUBE_URL,
        host: getHostFromUrl(RAPIDAPI_YOUTUBE_URL),
        params: (keyword) => ({ keyword }),
        parse: (data) => (typeof data === 'object' && data !== null) ? Object.values(data).map(id => `http://googleusercontent.com/youtube.com/3{id}`) : []
    },
    GlobalImageSearch: {
        method: 'POST',
        url: RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL,
        host: getHostFromUrl(RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL),
        data: (keyword) => ({ keywords: keyword, count: "30" }),
        parse: (data) => data?.results?.map(item => item.url)
    }
};

async function makeRequest(platform, keyword) {
    const config = API_CONFIGS[platform];
    if (!RAPIDAPI_KEY || !config?.url || !config?.host) {
        return { success: true, links: [], error: `Service not configured for ${platform}` };
    }

    logger.info(`[RapidAPI][${platform}] Searching with keyword: "${keyword}"`);

    try {
        const requestOptions = {
            method: config.method,
            url: config.url,
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': config.host },
            timeout: 25000
        };

        if (config.method === 'GET') requestOptions.params = config.params(keyword);
        else if (config.method === 'POST') requestOptions.data = config.data(keyword);
        
        const response = await axios.request(requestOptions);
        const links = config.parse(response.data)?.filter(Boolean) || [];
        
        logger.info(`[RapidAPI][${platform}] Search successful, found ${links.length} unique links.`);
        return { success: true, links: [...new Set(links)], error: null };

    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        logger.error(`[RapidAPI][${platform}] Request failed: ${errorMsg}`);
        return { success: false, links: [], error: errorMsg };
    }
}

module.exports = {
    youtubeSearch: (keyword) => makeRequest('YouTube', keyword),
    globalImageSearch: (keyword) => makeRequest('GlobalImageSearch', keyword)
};
