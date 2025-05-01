/**
 * express/utils/vectorSearch.js
 * - 與您部署的「Python 向量檢索微服務」(FastAPI + Milvus) 溝通
 * - 預設 Base URL 以 docker-compose 服務名稱 + Port 或環境變數指定
 * - 需先安裝 form-data (npm install form-data) / axios (npm install axios)
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// 若環境變數不存在，預設連到 docker-compose 內的 python-vector-service:8000 (您可依情況修改)
const PYTHON_VECTOR_SERVICE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://python-vector-service:8000';

// 假設 FastAPI 提供的索引端點 /api/v1/index-image，檢索端點 /api/v1/search-image
// 若您仍維持舊的 /api/v1/index /api/v1/search，可自行調整下述路徑
const INDEX_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/index`;
const SEARCH_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/search`;

/**
 * indexImageVector
 * 將本地圖片向量化並寫入 Milvus (或其他向量資料庫)
 * @param {string} localImagePath - 本地圖片路徑
 * @param {string|number} fileId   - 用於標記該圖片在 Milvus/DB 中的唯一 ID
 * @param {object} [options]       - 可選參數，視後端 API 是否支援 (modelName, etc.)
 * @returns {object|null}          - 回傳後端回應結果
 */
async function indexImageVector(localImagePath, fileId, options = {}) {
  try {
    // 確認檔案是否存在
    if (!fs.existsSync(localImagePath)) {
      throw new Error(`File not found: ${localImagePath}`);
    }

    const form = new FormData();
    // 讀取本地檔案
    form.append('image', fs.createReadStream(localImagePath));
    // 傳遞唯一 ID (fileId)
    form.append('id', fileId.toString());

    // 若後端支援 modelName、其他參數，可一併傳遞
    if (options.modelName) form.append('modelName', options.modelName);

    const res = await axios.post(INDEX_ENDPOINT, form, {
      headers: form.getHeaders(),
      timeout: 30000, // 30秒
    });

    console.log('[indexImageVector] success =>', res.data);
    return res.data;
  } catch (error) {
    console.error('[indexImageVector] error =>', error.message);
    return null;
  }
}

/**
 * searchImageByVector
 * 傳入本地圖片檔案，呼叫 Python 向量檢索，回傳相似度最高的結果
 * @param {string} localImagePath           - 本地圖片路徑
 * @param {object} [options]                - 可選參數
 * @param {number} [options.topK=3]         - 取回相似度最高的前幾筆
 * @param {string} [options.modelName]      - 指定模型 (例如 'clip-vit-base-patch32')
 * @returns {object|null}                   - 回傳後端回應結果，通常含 {results: [ ... ] }
 */
async function searchImageByVector(localImagePath, options = {}) {
  const { topK = 3, modelName } = options;

  try {
    if (!fs.existsSync(localImagePath)) {
      throw new Error(`File not found: ${localImagePath}`);
    }

    const form = new FormData();
    // 讀取本地檔案
    form.append('image', fs.createReadStream(localImagePath));
    // 可選 topK
    form.append('topK', String(topK));

    // 若後端支援不同的模型，可一併傳
    if (modelName) {
      form.append('modelName', modelName);
    }

    const res = await axios.post(SEARCH_ENDPOINT, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    console.log('[searchImageByVector] success =>', res.data);
    return res.data;
  } catch (error) {
    console.error('[searchImageByVector] error =>', error.message);
    return null;
  }
}

module.exports = {
  indexImageVector,
  searchImageByVector
};
