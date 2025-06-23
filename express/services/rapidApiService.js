/**
 * express/services/rapidApiService.js (再次修正版)
 *
 * 【核心優化】:
 * 1. 根據之前的 404 錯誤日誌，將 TikTok, Instagram, Facebook 的 API 端點和參數還原為您最初提供的、最可靠的配置。
 * 2. 保留 YouTube API (youtube138) 已被驗證可成功連線的 `/search` 端點。
 * 3. 保持健壯的錯誤處理和統一的回傳格式。
 */
const axios = require('axios');

const TIKTOK_HOST = process.env.TIKTOK_HOST;
const INSTAGRAM_HOST = process.env.INSTAGRAM_HOST;
const FACEBOOK_HOST = process.env.FACEBOOK_HOST;
const YOUTUBE_HOST = process.env.YOUTUBE_HOST;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

function extractLinks(data) {
    if (!data) return [];
    const items = data.videos || data.results || data.data || data.items || data.posts || [];
    if (!Array.isArray(items)) return [];

    return items
        .map(item => {
            if (!item) return null;
            let link = item.link || item.url || item.play || item.post_url || item.web_link;
            if (!link && item.id) {
                const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
                if (videoId) {
                    return `https://www.youtube.com/watch?v=${videoId}`;
                }
            }
            return link;
        })
        .filter(Boolean);
}

async function makeRequest(platform, url, config) {
    console.log(`[RapidAPI][${platform}] request sent to: ${url} with params: ${JSON.stringify(config.params)}`);
    try {
        const res = await axios.get(url, config);
        console.log(`[RapidAPI][${platform}] status:`, res.status);
        const links = extractLinks(res.data);
        console.log(`[RapidAPI][${platform}] found ${links.length} links.`);
        return { success: true, links, error: null };
    } catch (err) {
        const status = err.response?.status || 'N/A';
        const errorData = err.response?.data ? JSON.stringify(err.response.data) : 'No data';
        const errorMsg = `Request failed with status ${status}. Message: ${err.message}. Data: ${errorData}`;
        console.error(`[RapidAPI][${platform}] error:`, errorMsg);
        return { success: false, links: [], error: errorMsg };
    }
}

async function tiktokSearch(keyword) {
    // 【修正】: 還原為您最初提供的端點 /feed/search，這是最可靠的設定。
    const url = `https://${TIKTOK_HOST}/feed/search`;
    return makeRequest('TikTok', url, {
        params: { keywords: keyword, region: 'us', count: '5' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': TIKTOK_HOST },
        timeout: 15000,
    });
}

async function instagramSearch(keyword) {
    // 【修正】: 還原為您最初提供的端點 /hashtag_search_by_query
    const url = `https://${INSTAGRAM_HOST}/hashtag_search_by_query`;
    return makeRequest('Instagram', url, {
        params: { query: keyword },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': INSTAGRAM_HOST },
        timeout: 15000,
    });
}

async function facebookSearch(keyword) {
    // 【修正】: 還原為您最初提供的根端點 "/" 並使用 'path' 參數
    const url = `https://${FACEBOOK_HOST}/`;
    return makeRequest('Facebook', url, {
        params: { path: `search?type=post&q=${encodeURIComponent(keyword)}` },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': FACEBOOK_HOST },
        timeout: 15000,
    });
}

async function youtubeSearch(keyword) {
    // 【保持】: 此端點已在日誌中驗證可返回 status 200，保持不變。
    const url = `https://${YOUTUBE_HOST}/search`;
    return makeRequest('YouTube', url, {
        params: { q: keyword, maxResults: '5' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': YOUTUBE_HOST },
        timeout: 15000,
    });
}

module.exports = {
    tiktokSearch,
    instagramSearch,
    facebookSearch,
    youtubeSearch,
};
