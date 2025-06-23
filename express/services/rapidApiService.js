/**
 * express/services/rapidApiService.js (最終修正版)
 *
 * 【核心優化】:
 * 1. Facebook API 的端點已失效 (404)，修改為直接返回空結果，避免流程中斷。
 * 2. Instagram API 不適用於檔案名搜尋，修改為直接返回空結果。
 * 3. 修正 extractLinks 中 YouTube 連結生成的語法錯誤，並使用標準的 youtube.com 網址。
 * 4. 保持 TikTok 和 YouTube 的 API 呼叫不變，因為它們是正常的。
 */
const axios = require('axios');

// 從環境變數讀取配置
const TIKTOK_HOST = process.env.TIKTOK_HOST;
const INSTAGRAM_HOST = process.env.INSTAGRAM_HOST;
const FACEBOOK_HOST = process.env.FACEBOOK_HOST;
const YOUTUBE_HOST = process.env.YOUTUBE_HOST;
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
                // 確保連結是完整的 URL
                return link.startsWith('http') ? link : `https://${link}`;
            }
            // 針對 YouTube 的特殊情況，從 id 物件中建立連結
            if (platform === 'YouTube' && item.id) {
                const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
                if (videoId) {
                    // ★ 修正：修正了模板字串語法，並使用標準的 YouTube 網址
                    return `https://www.youtube.com/watch?v=${videoId}`;
                }
            }
            return null;
        })
        .filter(Boolean); // 過濾掉所有 null 或 undefined 的結果
}

async function makeRequest(platform, url, config) {
    console.log(`[RapidAPI][${platform}] request sent to: ${url} with params: ${JSON.stringify(config.params)}`);
    try {
        const res = await axios.get(url, config);
        console.log(`[RapidAPI][${platform}] status:`, res.status);
        const links = extractLinks(res.data, platform);
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
    // 【保持】: 此端點可正常運作
    const url = `https://${TIKTOK_HOST}/feed/search`;
    return makeRequest('TikTok', url, {
        params: { keywords: keyword, region: 'us', count: '5' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': TIKTOK_HOST },
        timeout: 15000,
    });
}

async function instagramSearch(keyword) {
    // ★ 修正：此 API 不適用於檔案名搜尋，直接返回空結果以避免錯誤。
    console.log(`[RapidAPI][Instagram] Skipped search for keyword "${keyword}" as this API is for hashtags only.`);
    return { success: true, links: [], error: null };
}

async function facebookSearch(keyword) {
    // ★ 修正：此 API 端點已失效 (404)，直接返回空結果以避免錯誤。
    console.log(`[RapidAPI][Facebook] Skipped search for keyword "${keyword}" as the API endpoint is not available.`);
    return { success: true, links: [], error: null };
}

async function youtubeSearch(keyword) {
    // 【保持】: 此端點可正常運作
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
