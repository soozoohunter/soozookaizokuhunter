/**
 * express/utils/vectorSearch.js
 *
 * 與您部署的「Python 向量檢索微服務」(FastAPI + Milvus) 溝通。
 * 預設 Base URL 以環境變數 PYTHON_VECTOR_SERVICE_URL 為主，
 * 若未設定則使用 http://python-vector-service:8000。
 *
 * indexImageVector: 將本地檔案上傳後端，做向量化並存入 Milvus。
 * searchImageByVector: 以本地檔案做相似度搜尋。
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// 預設連線端點
const PYTHON_VECTOR_SERVICE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://python-vector-service:8000';
const INDEX_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-insert`;
const SEARCH_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/image-search`;

/**
 * indexImageVector
 * 將圖片插入向量資料庫 (Milvus)
 * @param {string} localImagePath - 本地檔案路徑
 * @param {string} imageUrl       - 若後端需要記錄原始網址，可傳入(依後端需求)
 */
async function indexImageVector(localImagePath, imageUrl) {
  try {
    if (!fs.existsSync(localImagePath)) {
      throw new Error(`File not found: ${localImagePath}`);
    }

    const form = new FormData();
    // 若後端需要檔案 => form.append('image_file', fs.createReadStream(localImagePath));
    // 但此範例 python-vector-service 假設只需要 image_url
    form.append('image_url', imageUrl);

    const res = await axios.post(INDEX_ENDPOINT, form, {
      headers: form.getHeaders(),
      timeout: 30000
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
 * 將本地檔案以 base64 方式上傳給後端，做相似度搜尋
 * @param {string} localImagePath
 * @param {object} [options]
 * @param {number} [options.top_k=5]
 */
async function searchImageByVector(localImagePath, options = {}) {
  const { top_k = 5 } = options;
  try {
    if (!fs.existsSync(localImagePath)) {
      throw new Error(`File not found: ${localImagePath}`);
    }

    // 轉 base64
    const fileBuf = fs.readFileSync(localImagePath);
    const base64Str = fileBuf.toString('base64');

    const payload = {
      image_base64: base64Str,
      top_k
    };
    const res = await axios.post(SEARCH_ENDPOINT, payload, { timeout: 30000 });
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
