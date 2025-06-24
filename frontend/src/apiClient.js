/**
 * apiClient.js
 * 應用程式的集中式 API 請求模組
 *
 * 功能:
 * 1. 從環境變數中讀取後端 API 的基礎 URL，確保發出完整 URL。
 * 2. 自動將 localStorage 中的 token 加入到請求標頭 (headers) 中。
 * 3. 處理 FormData 和 JSON body 的 Content-Type。
 * 4. 統一的錯誤處理。
 */

/**
 * 從環境變數中讀取後端 API 的基礎 URL，若未設定則使用空字串，
 * 讓呼叫端在開發環境下可以自由指定完整路徑
 */
const BASE_URL = process.env.REACT_APP_API_URL || '';

/**
 * 執行一個 API 請求
 * @param {string} path - API 的路徑 (例如: '/api/protect/step1')
 * @param {object} options - Fetch API 的選項 (method, body, etc.)
 * @returns {Promise<any>} 解析後的 JSON 回應
 */
export async function apiRequest(path, options = {}) {
    const fullUrl = `${BASE_URL}${path}`;

    const headers = {
        // 如果 body 是 FormData，瀏覽器會自動設定 Content-Type
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    // 自動從 localStorage 中讀取 token 並加入到 Authorization 標頭
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || `伺服器錯誤: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API request to ${fullUrl} failed:`, error);
        // 將錯誤再次拋出，讓呼叫它的組件可以捕獲
        throw error;
    }
}
