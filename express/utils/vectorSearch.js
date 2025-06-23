/**
 * express/utils/vectorSearch.js (最終修正版)
 *
 * 與 Python 向量檢索服務 (FastAPI+Milvus) 溝通。
 *
 * 【核心修正】:
 * 1. 修改 `indexImageVector`，使其傳送包含 `image_url` 的 JSON，以匹配 Python API 的 `InsertImageRequest` 模型。
 * 2. 修改 `searchImageByVector`，使其讀取本地圖片並傳送包含 `image_base64` 的 JSON，以匹配 Python API 的 `ImageSearchRequest` 模型。
 * 3. 這將從根本上解決 Node.js 與 Python 之間的 API 契約不匹配問題。
 */
const fs = require('fs');
const axios = require('axios');

const PYTHON_VECTOR_SERVICE_URL = process.env.VECTOR_SERVICE_URL || 'http://suzoo_python_vector:8000';
const INDEX_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-insert`;
const SEARCH_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-search`;

/**
 * @param {string} publicImageUrl - 圖片的公開 URL
 * @param {string} fileId - 檔案的 ID (可選，備註用)
 */
async function indexImageVector(publicImageUrl, fileId) {
    if (!publicImageUrl) {
        console.warn('[indexImageVector] publicImageUrl is missing, skipping indexing.');
        return null;
    }
    try {
        console.log(`[indexImageVector] Indexing image via URL for fileId ${fileId}: ${publicImageUrl}`);
        
        // 【修正】: 發送 JSON，包含 image_url
        const payload = {
            image_url: publicImageUrl,
        };
        
        const res = await axios.post(INDEX_ENDPOINT, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        console.log(`[indexImageVector] Successfully indexed for fileId ${fileId}. Response:`, res.data);
        return res.data;
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        console.error(`[indexImageVector] Error indexing image URL for fileId ${fileId}:`, errorMsg);
        return null;
    }
}

/**
 * @param {string} localImagePath - 進行搜尋的本地圖片路徑
 * @param {object} options - 包含 topK 等選項
 */
async function searchImageByVector(localImagePath, options = {}) {
    if (!fs.existsSync(localImagePath)) {
        console.warn(`[searchImageByVector] File not found, cannot perform search for: ${localImagePath}`);
        return null;
    }
    const { topK = 3 } = options;
    try {
        console.log(`[searchImageByVector] Searching for similar images to: ${localImagePath}`);
        
        // 【修正】: 讀取檔案，轉為 Base64，發送 JSON
        const imageBase64 = fs.readFileSync(localImagePath, { encoding: 'base64' });
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
