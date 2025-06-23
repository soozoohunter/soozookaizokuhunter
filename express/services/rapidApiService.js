/**
 * express/services/rapidApiService.js (最終修正版)
 *
 * 【核心優化】:
 * 1. 修正 Facebook API 的 404 錯誤，將路徑直接寫入 URL。
 * 2. 處理 Instagram API 的 "expected hashtag" 錯誤，對關鍵字進行清理。
 * 3. 修正 YouTube 連結生成時的語法錯誤。
 * 4. 保持 TikTok 和 YouTube 已驗證可用的端點不變。
 * 5. 維持統一的錯誤處理和日誌記錄。
 */
const axios = require('axios');

const TIKTOK_HOST = process.env.TIKTOK_HOST;
const INSTAGRAM_HOST = process.env.INSTAGRAM_HOST;
const FACEBOOK_HOST = process.env.FACEBOOK_HOST;
const YOUTUBE_HOST = process.env.YOUTUBE_HOST;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

function extractLinks(data) {
    if (!data) return [];
    // 統一處理不同 API 可能的回傳結構
    const items = data.videos || data.results || data.data || data.items || data.posts || [];
    if (!Array.isArray(items)) return [];

    return items
        .map(item => {
            if (!item) return null;
            // 優先提取已有的連結
            let link = item.link || item.url || item.play || item.post_url || item.web_link;
            if (link) {
                return link;
            }
            // 針對 YouTube 的特殊情況，從 id 物件中建立連結
            if (!link && item.id) {
                const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
                if (videoId) {
                    // ★★★ 修正：修正了模板字串的語法錯誤 (0{videoId} -> ${videoId}) ★★★
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
    // 【保持】: 此端點 /feed/search 已驗證可通。
    const url = `https://${TIKTOK_HOST}/feed/search`;
    return makeRequest('TikTok', url, {
        params: { keywords: keyword, region: 'us', count: '5' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': TIKTOK_HOST },
        timeout: 15000,
    });
}

async function instagramSearch(keyword) {
    // 【修正】: 為了解決 'expected hashtag' 錯誤，清理關鍵字，只保留字母和數字。
    // "IMG_1654" 將變成 "IMG1654"
    const cleanedKeyword = keyword.replace(/[^a-zA-Z0-9]/g, '');
    const url = `https://${INSTAGRAM_HOST}/hashtag_search_by_query`;
    return makeRequest('Instagram', url, {
        params: { query: cleanedKeyword },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': INSTAGRAM_HOST },
        timeout: 15000,
    });
}

async function facebookSearch(keyword) {
    // 【修正】: 為了解決 404 錯誤，將 'search' 路徑直接放入 URL，並將查詢參數放入 params 物件。
    const url = `https://${FACEBOOK_HOST}/search`;
    return makeRequest('Facebook', url, {
        params: { type: 'post', q: keyword },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': FACEBOOK_HOST },
        timeout: 15000,
    });
}

async function youtubeSearch(keyword) {
    // 【保持】: 此端點 /search 已在日誌中驗證可返回 status 200，保持不變。
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
