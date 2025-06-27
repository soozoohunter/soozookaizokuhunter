// express/services/rapidApi.service.js (Final Refactored Version)
const axios = require('axios');
const logger = require('../utils/logger');

const {
    RAPIDAPI_KEY,
    RAPIDAPI_TIKTOK_URL,
    RAPIDAPI_YOUTUBE_URL,
    RAPIDAPI_INSTAGRAM_URL,
    RAPIDAPI_FACEBOOK_URL
} = process.env;

function getHostFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}

async function makeRequest(platform, url, params, keyword) {
    const host = getHostFromUrl(url);
    if (!RAPIDAPI_KEY || !url || !host) {
        const errorMsg = `[RapidAPI][${platform}] API Key or URL/Host not configured.`;
        logger.warn(errorMsg);
        return { success: false, links: [], error: errorMsg };
    }

    logger.info(`[RapidAPI][${platform}] Searching with keyword: "${keyword}" at ${url}`);

    try {
        const response = await axios.request({
            method: 'GET',
            url,
            params,
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': host
            },
            timeout: 15000
        });

        const items = response.data?.data?.items || response.data?.results?.items || response.data?.videos || response.data?.posts || response.data?.data || response.data?.results || response.data || [];
        if (!Array.isArray(items)) {
            logger.warn(`[RapidAPI][${platform}] Response data is not an array.`, response.data);
            return { success: true, links: [], error: null };
        }

        const links = items.map(item => {
            if (!item) return null;
            let url = item.link || item.url || item.play || item.post_url || item.web_link || item.media_url;
            if (!url && platform === 'YouTube' && item.id?.videoId) {
                return `https://www.youtube.com/watch?v=${item.id.videoId}`;
            }
            return (url && typeof url === 'string' && url.startsWith('http')) ? url : null;
        }).filter(Boolean);

        logger.info(`[RapidAPI][${platform}] Search successful, found ${links.length} links.`);
        return { success: true, links, error: null };

    } catch (err) {
        const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
        logger.error(`[RapidAPI][${platform}] Request failed: ${errorMsg}`);
        return { success: false, links: [], error: errorMsg };
    }
}

const tiktokSearch = (keyword) => makeRequest('TikTok', RAPIDAPI_TIKTOK_URL, { keywords: keyword, count: '10' }, keyword);
const youtubeSearch = (keyword) => makeRequest('YouTube', RAPIDAPI_YOUTUBE_URL, { q: keyword, maxResults: '10' }, keyword);
const instagramSearch = (keyword) => makeRequest('Instagram', RAPIDAPI_INSTAGRAM_URL, { query: keyword, count: '10' }, keyword);
const facebookSearch = (keyword) => makeRequest('Facebook', RAPIDAPI_FACEBOOK_URL, { q: keyword, limit: '10' }, keyword);

module.exports = { tiktokSearch, youtubeSearch, instagramSearch, facebookSearch };
