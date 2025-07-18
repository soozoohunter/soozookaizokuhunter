/**
 * apiClient.js
 * 應用程式的集中式 API 請求模組
 *
 * 功能:
 * 1. 從環境變數中讀取後端 API 的基礎 URL。
 * 2. 自動將 localStorage 中的 token 加入到請求標頭 (headers) 中。
 * 3. 處理 FormData 和 JSON body。
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

    // 調試日誌
    if (process.env.NODE_ENV !== 'production') {
        console.log(`API Request: ${fullUrl}`, options);
    }

    const headers = {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
            body: options.body instanceof FormData ? options.body : JSON.stringify(options.body),
        });

        // 處理非JSON響應
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const errorMessage = data.message || data.error || `伺服器錯誤: ${response.status}`;
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error(`API request to ${fullUrl} failed:`, error);
        throw error;
    }
}

// Provide a simple client wrapper for convenience
export const apiClient = {
    get: (path, options = {}) => apiRequest(path, { method: 'GET', ...options }),
    post: (path, body, options = {}) => apiRequest(path, { method: 'POST', body, ...options }),
    put: (path, body, options = {}) => apiRequest(path, { method: 'PUT', body, ...options }),
    delete: (path, options = {}) => apiRequest(path, { method: 'DELETE', ...options }),
};
