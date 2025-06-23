/**
 * File: express/services/vectorSearch.js (最終修正版)
 *
 * 說明：
 * 1. 修正了 indexImage/searchLocalImage 的請求格式，改用 form-data。
 * 2. 這能更好地與 Python FastAPI 的 File/Form 處理方式對接。
 * 3. 其他函數保持不變。
 */
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data'); // 引入 form-data

const PYTHON_VECTOR_URL = process.env.PYTHON_VECTOR_URL || 'http://suzoo_python_vector:8000';

/**
 * ★ 核心修正：將圖片索引請求改為使用 multipart/form-data 格式
 * @param {string} localFilePath - 本地圖片檔案的路徑
 * @param {string} id - 圖片的唯一 ID
 */
async function indexImage(localFilePath, id) {
  const form = new FormData();
  form.append('image', fs.createReadStream(localFilePath));
  form.append('id', id);

  try {
    const url = `${PYTHON_VECTOR_URL}/api/v1/image-insert`;
    const resp = await axios.post(url, form, {
      headers: {
        ...form.getHeaders()
      }
    });
    return resp.data;
  } catch (err) {
    const errorDetails = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error(`[indexImage] error: ${errorDetails}`);
    throw new Error(err.response ? err.response.data.detail : err.message);
  }
}

/**
 * ★ 核心修正：將本地圖片搜索請求也改為使用 multipart/form-data 格式
 * @param {string} localFilePath - 本地圖片檔案的路徑
 * @param {number} topK - 返回結果數量
 */
async function searchLocalImage(localFilePath, topK = 5) {
  const form = new FormData();
  form.append('image', fs.createReadStream(localFilePath));
  form.append('top_k', topK.toString());

  try {
    const url = `${PYTHON_VECTOR_URL}/api/v1/image-search`;
    const resp = await axios.post(url, form, {
      headers: {
        ...form.getHeaders()
      }
    });
    return resp.data; // { results: [ { id, score }, ... ] }
  } catch (err) {
    const errorDetails = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error(`[searchLocalImage] error: ${errorDetails}`);
    throw new Error(err.response ? err.response.data.detail : err.message);
  }
}

module.exports = {
  indexImage, // 導出新的 indexImage 函數
  searchLocalImage
};
