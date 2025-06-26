const axios = require('axios');
const logger = require('../utils/logger');

const TIKTOK_HOST = process.env.TIKTOK_HOST;
const YOUTUBE_HOST = process.env.YOUTUBE_HOST;
const INSTAGRAM_HOST = process.env.INSTAGRAM_HOST;
const FACEBOOK_HOST = process.env.FACEBOOK_HOST;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

function extractLinks(data, platform) {
    if (!data) return [];
    const items = data.videos || data.results || data.data || data.items || data.posts || [];
    if (!Array.isArray(items)) return [];

    return items
        .map(item => {
            if (!item) return null;
            let link = item.link || item.url || item.play || item.post_url || item.web_link;
            if (link) {
                return link.startsWith('http') ? link : `https://${link}`;
            }
            if (platform === 'YouTube' && item.id) {
                const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
                if (videoId) {
                    return `https://www.youtube.com/watch?v=${videoId}`;
                }
            }
            return null;
        })
        .filter(Boolean);
}

async function makeRequest(platform, url, config) {
    logger.info(`[RapidAPI][${platform}] sending request to: ${url}`);
    try {
        const res = await axios.get(url, config);
        const links = extractLinks(res.data, platform);
        logger.info(`[RapidAPI][${platform}] found ${links.length} links.`);
        return { success: true, links, error: null };
    } catch (err) {
        const errorMsg = `Request failed: ${err.message}`;
        logger.error(`[RapidAPI][${platform}] error:`, errorMsg);
        return { success: false, links: [], error: errorMsg };
    }
}

async function tiktokSearch(keyword) {
    if (!TIKTOK_HOST || !RAPIDAPI_KEY) return { success: false, links: [], error: 'TikTok API not configured.' };
    const url = `https://${TIKTOK_HOST}/feed/search`;
    return makeRequest('TikTok', url, {
        params: { keywords: keyword, region: 'us', count: '5' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': TIKTOK_HOST },
        timeout: 15000,
    });
}

async function youtubeSearch(keyword) {
    if (!YOUTUBE_HOST || !RAPIDAPI_KEY) return { success: false, links: [], error: 'YouTube API not configured.' };
    const url = `https://${YOUTUBE_HOST}/search`;
    return makeRequest('YouTube', url, {
        params: { q: keyword, maxResults: '5' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': YOUTUBE_HOST },
        timeout: 15000,
    });
}

async function instagramSearch(keyword) {
    if (!INSTAGRAM_HOST || !RAPIDAPI_KEY) return { success: false, links: [], error: 'Instagram API not configured.' };
    const url = `https://${INSTAGRAM_HOST}/search`;
    return makeRequest('Instagram', url, {
        params: { query: keyword, count: '5' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': INSTAGRAM_HOST },
        timeout: 15000,
    });
}

async function facebookSearch(keyword) {
    if (!FACEBOOK_HOST || !RAPIDAPI_KEY) return { success: false, links: [], error: 'Facebook API not configured.' };
    const url = `https://${FACEBOOK_HOST}/search`;
    return makeRequest('Facebook', url, {
        params: { query: keyword, limit: '5' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': FACEBOOK_HOST },
        timeout: 15000,
    });
}

module.exports = {
    tiktokSearch,
    instagramSearch,
    facebookSearch,
    youtubeSearch,
};
