/**
 * apiClient.js
 * 應用程式的集中式 API 請求模組
 *
 * 功能:
 * 1. 從環境變數中讀取後端 API 的基礎 URL。
 * 2. 自動將 localStorage 中的 token 加入到請求標頭 (headers) 中。
 * 3. 處理 FormData 和 JSON body。
 */

// 從 .env 檔案讀取後端 API 的基礎 URL，如果沒有則使用預設值
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * 執行一個 API 請求
 * @param {string} path - API 的路徑 (例如: '/api/protect/step1')
 * @param {object} options - Fetch API 的選項 (method, body, etc.)
 * @returns {Promise<any>} 解析後的 JSON 回應
 */
export async function apiRequest(path, options = {}) {
    const fullUrl = `${BASE_URL}${path}`;

    const headers = {
        // 如果 body 是 FormData，瀏覽器會自動設定 Content-Type，所以我們不要手動設定它
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers, // 允許傳入自訂的 headers
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

        // 檢查回應是否為 JSON 格式
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
            const data = await response.json();
            if (!response.ok) {
                // 如果後端回傳錯誤，將其拋出
                throw new Error(data.message || data.error || '發生未知錯誤');
            }
            return data;
        } else {
             if (!response.ok) {
                // 如果不是 JSON，但仍是錯誤，讀取文字內容
                const textData = await response.text();
                throw new Error(textData || `伺服器錯誤: ${response.status}`);
            }
            // 如果成功但不是 JSON，直接回傳 response 物件
            return response;
        }
    } catch (error) {
        console.error(`API request to ${fullUrl} failed:`, error);
        // 將錯誤再次拋出，讓呼叫它的組件可以捕獲
        throw error;
    }
}
