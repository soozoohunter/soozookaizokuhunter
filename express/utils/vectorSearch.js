/**
 * express/utils/vectorSearch.js (完整修正版)
 *
 * 與 Python 向量檢索服務 (FastAPI+Milvus) 溝通。
 *
 * 【核心修正】:
 * 1. 修改 `searchImageByVector` 函式，使其與 `indexImageVector` 同樣使用 `FormData` (multipart/form-data) 格式傳送圖片。
 * 這解決了之前因傳送 base64 字串而導致的 400 Bad Request 錯誤。
 * 2. 統一了與後端 Python 服務的通訊方式，增強了穩定性。
 * 3. 增加了更詳細的錯誤日誌輸出。
 */
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

// 可以透過環境變數覆蓋服務 URL，預設使用 docker-compose 內的 container name
const PYTHON_VECTOR_SERVICE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://suzoo_python_vector:8000';
const INDEX_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-insert`;
const SEARCH_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-search`;

async function indexImageVector(localImagePath, fileId, options = {}) {
    if (!fs.existsSync(localImagePath)) {
        console.warn(`[indexImageVector] File not found, skipping indexing for: ${localImagePath}`);
        return null;
    }
    try {
        console.log(`[indexImageVector] Indexing image: ${localImagePath} with ID: ${fileId}`);
        const form = new FormData();
        form.append('image', fs.createReadStream(localImagePath));
        form.append('id', fileId.toString());
        if (options.modelName) form.append('modelName', options.modelName);

        const res = await axios.post(INDEX_ENDPOINT, form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        console.log(`[indexImageVector] Successfully indexed ID ${fileId}. Response:`, res.data);
        return res.data;
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        console.error(`[indexImageVector] Error indexing image ID ${fileId}:`, errorMsg);
        // 不向上拋出錯誤，索引失敗不應中斷主流程
        return null;
    }
}

async function searchImageByVector(localImagePath, options = {}) {
    if (!fs.existsSync(localImagePath)) {
        console.warn(`[searchImageByVector] File not found, cannot perform search for: ${localImagePath}`);
        return null;
    }
    const { topK = 3, modelName } = options;
    try {
        console.log(`[searchImageByVector] Searching for similar images to: ${localImagePath}`);
        
        // 【修正】: 改為使用 FormData 來傳送搜尋請求，與索引的邏輯保持一致。
        const form = new FormData();
        form.append('image', fs.createReadStream(localImagePath), {
            filename: path.basename(localImagePath)
        });
        form.append('top_k', topK.toString());
        if (modelName) form.append('model_name', modelName);

        const res = await axios.post(SEARCH_ENDPOINT, form, {
            headers: form.getHeaders(), //讓 axios 自動設定 Content-Type 和 boundary
            timeout: 30000
        });

        console.log('[searchImageByVector] Search successful. Response:', res.data);
        return res.data;
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        console.error(`[searchImageByVector] Error searching image:`, errorMsg);
        // 在 protect.js 中已經有 try/catch 處理，這裡返回 null
        return null;
    }
}

module.exports = {
    indexImageVector,
    searchImageByVector
};
