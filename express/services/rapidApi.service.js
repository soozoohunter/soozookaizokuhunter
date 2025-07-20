const axios = require('axios');
const logger = require('../utils/logger');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ? process.env.RAPIDAPI_KEY.trim() : '';

// [新增] 配置所有 API 端點
const RAPIDAPI_YOUTUBE_URL = 'https://youtube-search-and-download.p.rapidapi.com';
const RAPIDAPI_TIKTOK_URL = 'https://tiktok-video-no-watermark2.p.rapidapi.com';
const RAPIDAPI_INSTAGRAM_URL = 'https://instagram-scraper-api2.p.rapidapi.com/v1';
const RAPIDAPI_FACEBOOK_URL = 'https://facebook-scraper-api.p.rapidapi.com/v1';
const RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL = 'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/ImageSearchAPI';

function isInitialized() {
    return !!RAPIDAPI_KEY;
}

const API_CONFIGS = {
  youtube: {
    enabled: true, // [修正] 啟用服務
    method: 'GET',
    url: `${RAPIDAPI_YOUTUBE_URL}/search`,
    host: 'youtube-search-and-download.p.rapidapi.com',
    params: (keyword) => ({ query: keyword, sort: 'r', type: 'v' }),
    parse: (data) => data.contents?.map(item => `https://www.youtube.com/watch?v=${item.video.videoId}`) || []
  },
  tiktok: {
    enabled: true, // [修正] 啟用服務
    method: 'GET',
    url: RAPIDAPI_TIKTOK_URL,
    host: 'tiktok-video-no-watermark2.p.rapidapi.com',
    params: (keyword) => ({ keywords: keyword, count: 20 }),
    parse: (data) => data.data?.map(item => item.play) || []
  },
  instagram: {
    enabled: true, // [修正] 啟用服務
    method: 'GET',
    url: `${RAPIDAPI_INSTAGRAM_URL}/posts`,
    host: 'instagram-scraper-api2.p.rapidapi.com',
    params: (keyword) => ({ hashtag: keyword }),
    parse: (data) => data.data?.map(item => `https://www.instagram.com/p/${item.shortcode}`) || []
  },
  facebook: {
    enabled: true, // [修正] 啟用服務
    method: 'GET',
    url: `${RAPIDAPI_FACEBOOK_URL}/posts`,
    host: 'facebook-scraper-api.p.rapidapi.com',
    params: (keyword) => ({ id: keyword }),
    parse: (data) => data.data?.map(item => item.url) || []
  },
  globalImage: {
    enabled: true, // [修正] 啟用服務
    method: 'GET',
    url: RAPIDAPI_GLOBAL_IMAGE_SEARCH_URL,
    host: 'contextualwebsearch-websearch-v1.p.rapidapi.com',
    params: (keyword) => ({ q: keyword, pageNumber: 1, pageSize: 30, autoCorrect: true }),
    parse: (data) => data.value?.map(item => item.url) || []
  }
};

async function searchPlatform(platform, keyword) {
    const config = API_CONFIGS[platform];

    if (!RAPIDAPI_KEY || !config || !config.enabled) {
        logger.info(`[RapidAPI][${platform}] Service is disabled or not configured in .env`);
        return [];
    }

    if (!/^\w{20,}$/.test(RAPIDAPI_KEY)) {
        logger.error('[RapidAPI] API key format appears invalid');
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
        const status = err.response?.status;
        const errorMsg = err.response?.data?.message || err.message;
        logger.error(`[RapidAPI][${platform}] Request failed: ${errorMsg}`);

        if (status === 403) {
            logger.warn(`[RapidAPI][${platform}] Subscription issue detected, disabling this API.`);
            API_CONFIGS[platform].enabled = false;
            return [];
        }

        throw new Error(`[${platform}] ${errorMsg}`);
    }
}

module.exports = {
    searchPlatform,
    isInitialized,
};
