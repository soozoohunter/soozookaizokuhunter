/**
 * express/services/rapidApiService.js (完整重構與優化版)
 *
 * 【核心優化】:
 * 1. 統一回傳格式: 所有函式無論成功或失敗，都回傳 { success, links, error } 物件，增加程式韌性。
 * 2. 健壯的錯誤處理: 在內部消化錯誤，回傳失敗狀態，而不是向上拋出導致程式崩潰。
 * 3. 修正 API 端點/參數: 根據日誌錯誤碼，盡最大努力修正了各平台的 API 呼叫方式。
 * 4. 增強日誌: 失敗時印出 API 回傳的具體錯誤訊息，方便未來除錯。
 * 5. 註解警示: 明確標示出這些 API 的不穩定性，符合我們的研究結論。
 */
const axios = require('axios');

const TIKTOK_HOST = process.env.TIKTOK_HOST;
const INSTAGRAM_HOST = process.env.INSTAGRAM_HOST;
const FACEBOOK_HOST = process.env.FACEBOOK_HOST;
const YOUTUBE_HOST = process.env.YOUTUBE_HOST;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

/**
 * 從多種可能的 API 回傳格式中提取連結陣列
 * @param {object} data - API 回傳的資料物件
 * @returns {string[]} - 提取出的 URL 陣列
 */
function extractLinks(data) {
    if (!data) return [];
    // 根據觀察，API 可能的回傳欄位包含 videos, results, data, items, posts 等
    const items = data.videos || data.results || data.data || data.items || data.posts || [];
    if (!Array.isArray(items)) return [];

    return items
        .map(item => {
            if (!item) return null;
            // 處理多種可能的連結欄位
            let link = item.link || item.url || item.play || item.post_url;
            // 針對 YouTube 的特殊處理
            if (!link && item.id) {
                const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
                if (videoId) {
                    return `https://www.youtube.com/watch?v=${videoId}`;
                }
            }
            return link;
        })
        .filter(Boolean); // 過濾掉 null 或 undefined 的結果
}

/**
 * 建立一個統一的 API 請求函式以減少重複程式碼
 * @param {string} platform - 'TikTok', 'Instagram', 'Facebook', 'YouTube'
 * @param {string} url - 完整的請求 URL
 * @param {object} config - Axios 的請求設定
 * @returns {Promise<{success: boolean, links: string[], error: string|null}>}
 */
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
    // 【警告】: 此類 API 極不穩定。TikTok 的反爬蟲機制非常嚴格。
    // 根據您的日誌，此 API 的 '/feed/search' 端點回傳 404，可能是端點已變更。
    // 我們嘗試另一個常見的端點 '/search/'. 如果仍然失敗，代表此 API 已失效。
    const url = `https://${TIKTOK_HOST}/search/`;
    return makeRequest('TikTok', url, {
        params: { keywords: keyword, count: '5' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': TIKTOK_HOST },
        timeout: 15000,
    });
}

async function instagramSearch(keyword) {
    // 【警告】: 爬取 Instagram 資料極其困難且有法律風險。此 API 成功率極低。
    // 根據您的日誌，'/hashtag_search_by_query' 回傳 404。
    // 我們根據 API 文件修正為 /search, 並使用 type: 'hashtag'
    const url = `https://${INSTAGRAM_HOST}/search`;
    return makeRequest('Instagram', url, {
        params: { query: keyword, type: 'hashtag' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': INSTAGRAM_HOST },
        timeout: 15000,
    });
}

async function facebookSearch(keyword) {
    // 【警告】: 非官方 Facebook API 基本都無法長期運作。
    // 400 Bad Request 通常是參數問題。您原先的 path 參數是正確的，但可能 API 期望不同的格式。
    // 我們保持您原有的 path 結構，因為這是此類代理的常見模式。如果持續失敗，代表 API 後端有問題。
    const url = `https://${FACEBOOK_HOST}/`;
    return makeRequest('Facebook', url, {
        params: { path: `search?type=post&q=${encodeURIComponent(keyword)}` },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': FACEBOOK_HOST },
        timeout: 15000,
    });
}

async function youtubeSearch(keyword) {
    // 【警告】: 根據我們的研究，此 API (youtube138) 存在驗證 Bug (403錯誤)。
    // 雖然我們保持呼叫，但預期它仍然會失敗。建議優先考慮遷移至官方 YouTube Data API v3 或專業服務。
    const url = `https://${YOUTUBE_HOST}/search/`; // 嘗試在路徑結尾加上斜線
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
