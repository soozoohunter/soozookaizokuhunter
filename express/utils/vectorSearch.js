/**
 * express/utils/vectorSearch.js (最終通訊協定修正版)
 *
 * 【核心修正】:
 * 1. 根據修正後的 Python API，將 `indexImageVector` 和 `searchImageByVector` 都改為使用 `form-data` (multipart/form-data) 格式傳送圖片檔案。
 * 2. 這確保了 Node.js 客戶端與 Python 伺服器之間的通訊協定完全一致且健壯。
 */
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const PYTHON_VECTOR_SERVICE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://suzoo_python_vector:8000';
// 【API 修正】: 確保端點路徑與 Python 中定義的完全一致
const INDEX_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-insert`;
const SEARCH_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-search`;

/**
 * 【API 修正】: 發送本地圖片檔案和 ID 到 Python 服務進行索引
 * @param {string} localImagePath - 圖片在本地的檔案路徑。
 * @param {string} fileId - 檔案在資料庫中的 ID。
 * @returns {Promise<object|null>}
 */
async function indexImageVector(localImagePath, fileId) {
    if (!fs.existsSync(localImagePath)) {
        console.warn(`[indexImageVector] File not found, skipping indexing for: ${localImagePath}`);
        return null;
    }
    try {
        console.log(`[indexImageVector] Indexing image via file upload: ${localImagePath} with ID: ${fileId}`);
        const form = new FormData();
        form.append('image', fs.createReadStream(localImagePath), { filename: path.basename(localImagePath) });
        form.append('id', fileId.toString());

        const res = await axios.post(INDEX_ENDPOINT, form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        console.log(`[indexImageVector] Successfully indexed ID ${fileId}. Response:`, res.data);
        return res.data;
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        console.error(`[indexImageVector] Error indexing image ID ${fileId}:`, errorMsg);
        return null;
    }
}

/**
 * 【API 修正】: 上傳本地圖片到 Python 服務以搜尋相似圖片
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
        console.log(`[searchImageByVector] Searching for similar images via file upload: ${localImagePath}`);
        
        const form = new FormData();
        form.append('image', fs.createReadStream(localImagePath), { filename: path.basename(localImagePath) });
        form.append('top_k', topK.toString());

        const res = await axios.post(SEARCH_ENDPOINT, form, {
            headers: form.getHeaders(),
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
