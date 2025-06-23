/**
 * express/utils/vectorSearch.js (通訊協定修正版)
 *
 * 與 Python 向量檢索服務 (FastAPI+Milvus) 溝通。
 *
 * 【核心修正】:
 * 1. 根據 Python 服務的實際 API 定義，將所有請求改為發送 `application/json` 格式。
 * 2. `indexImageVector` 現在接收一個公開的圖片 URL，並將其發送給 Python 進行索引。
 * 3. `searchImageByVector` 現在讀取本地圖片，將其轉為 base64 字串，然後發送給 Python 進行搜尋。
 */
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const PYTHON_VECTOR_SERVICE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://suzoo_python_vector:8000';
const INDEX_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-insert`;
const SEARCH_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-search`;

/**
 * 【通訊協定修正】
 * 請求 Python 服務將指定 URL 的圖片加入索引。
 * @param {string} publicImageUrl - 圖片可公開訪問的 URL。
 * @param {string} fileId - 檔案在資料庫中的 ID。
 * @returns {Promise<object|null>}
 */
async function indexImageVector(publicImageUrl, fileId) {
    if (!publicImageUrl) {
        console.warn(`[indexImageVector] publicImageUrl is missing, skipping indexing for fileId: ${fileId}`);
        return null;
    }
    try {
        console.log(`[indexImageVector] Requesting to index image via URL: ${publicImageUrl} for ID: ${fileId}`);
        
        // Python 服務期望一個包含 image_url 的 JSON 物件
        const payload = {
            image_url: publicImageUrl
        };
        // 在 Python 端的 API 中，ID 是通過 URL 的一部分或其他方式傳遞的，
        // 但根據您提供的 app.py，它似乎是直接用 URL 作為唯一識別。
        // 如果需要傳遞 ID，則 Python API 需要修改。目前我們先遵循 `app.py` 的邏輯。

        const res = await axios.post(INDEX_ENDPOINT, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        
        console.log(`[indexImageVector] Successfully requested indexing for ID ${fileId}. Response:`, res.data);
        return res.data;
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        console.error(`[indexImageVector] Error requesting indexing for ID ${fileId}:`, errorMsg);
        return null;
    }
}

/**
 * 【通訊協定修正】
 * 讀取本地圖片，轉為 base64，並請求 Python 服務搜尋相似圖片。
 * @param {string} localImagePath - 圖片在本地的檔案路徑。
 * @param {object} options - 包含 topK 等選項的物件。
 * @returns {Promise<object|null>}
 */
async function searchImageByVector(localImagePath, options = {}) {
    if (!fs.existsSync(localImagePath)) {
        console.warn(`[searchImageByVector] File not found, cannot perform search for: ${localImagePath}`);
        return null;
    }
    const { topK = 5 } = options;
    try {
        console.log(`[searchImageByVector] Searching for similar images to: ${localImagePath}`);
        
        // 讀取檔案並轉為 base64 字串
        const imageBase64 = fs.readFileSync(localImagePath, { encoding: 'base64' });

        // Python 服務期望一個包含 image_base64 和 top_k 的 JSON 物件
        const payload = {
            image_base64: imageBase64,
            top_k: topK,
        };

        const res = await axios.post(SEARCH_ENDPOINT, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        console.log('[searchImageByVector] Search successful. Response:', res.data);
        return res.data;
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        console.error(`[searchImageByVector] Error searching image:`, errorMsg);
        return null;
    }
}

module.exports = {
    indexImageVector,
    searchImageByVector
};
