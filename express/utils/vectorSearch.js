/**
 * express/utils/vectorSearch.js (最終修正版)
 *
 * 【核心修正】:
 * 1. 根據 Python `app.py` 的實際 API 定義，徹底修改了兩個函式的請求格式。
 * 2. `indexImageVector` 現在發送包含 `image_url` 的 JSON，而不是檔案。
 * 3. `searchImageByVector` 現在發送包含 `image_base64` 的 JSON，而不是 FormData。
 * 4. 這將解決客戶端與伺服器之間的 API "契約" 不匹配問題。
 */
const fs = require('fs');
const axios = require('axios');
// FormData 在此版本中不再需要，因為我們發送的是 JSON
// const FormData = require('form-data'); 

const PYTHON_VECTOR_SERVICE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://suzoo_python_vector:8000';
const INDEX_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-insert`;
const SEARCH_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-search`;

/**
 * 請求 Python 服務，將一個公開的圖片 URL 加入 Milvus 索引。
 * @param {string} publicImageUrl - 必須是一個可公開訪問的圖片 URL。
 * @param {string} fileId - 對應的檔案 ID。
 * @returns {Promise<object|null>}
 */
async function indexImageVector(publicImageUrl, fileId) {
    if (!publicImageUrl) {
        console.warn('[indexImageVector] publicImageUrl is missing, skipping indexing.');
        return null;
    }
    try {
        console.log(`[indexImageVector] Requesting to index public URL: ${publicImageUrl} for ID: ${fileId}`);

        // 【修正】: 發送 JSON，內容為公開的圖片 URL，以符合 Python API 的要求。
        const payload = {
            image_url: publicImageUrl
        };

        const res = await axios.post(INDEX_ENDPOINT, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        console.log(`[indexImageVector] Successfully requested indexing for ID ${fileId}. Response:`, res.data);
        return res.data;
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        console.error(`[indexImageVector] Error indexing image ID ${fileId}:`, errorMsg);
        return null;
    }
}

/**
 * 請求 Python 服務，用一張本地圖片去搜尋 Milvus 中的相似圖片。
 * @param {string} localImagePath - 本地圖片檔案的路徑。
 * @param {object} options - 包含 topK 等選項。
 * @returns {Promise<object|null>}
 */
async function searchImageByVector(localImagePath, options = {}) {
    if (!fs.existsSync(localImagePath)) {
        console.warn(`[searchImageByVector] File not found, cannot perform search for: ${localImagePath}`);
        return null;
    }
    const { topK = 3 } = options;
    try {
        console.log(`[searchImageByVector] Searching for similar images to: ${localImagePath}`);
        
        // 【修正】: 讀取檔案為 base64，並發送包含 image_base64 的 JSON。
        const imageBase64 = fs.readFileSync(localImagePath, { encoding: 'base64' });
        
        const payload = {
            image_base64: imageBase64,
            top_k: topK
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
