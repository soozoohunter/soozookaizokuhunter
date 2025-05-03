/**
 * File: express/services/vectorSearch.js
 *
 * 說明：
 *  1. 這裡維持您原本的 Python Microservice 呼叫邏輯不變。
 *  2. 若有需要可再調整環境變數名稱或連線位置。
 */

const axios = require('axios');
const fs = require('fs'); // ★ 為了能讀取本機檔案 (searchLocalImage)

// 若 Compose 內部要呼叫 suzoo_python_vector:8000
// 對外開 8001 => 內部仍是 8000
const VECTOR_SERVICE_HOST = process.env.VECTOR_SERVICE_HOST || 'suzoo_python_vector';
const VECTOR_SERVICE_PORT = process.env.VECTOR_SERVICE_PORT || '8000';

// 文字嵌入 => { embedding: [...] }
async function embedText(text) {
  try {
    const url = `http://${VECTOR_SERVICE_HOST}:${VECTOR_SERVICE_PORT}/api/v1/text-embed`;
    const resp = await axios.post(url, { text });
    return resp.data; // { embedding: [...] }
  } catch (err) {
    console.error('[embedText] error:', err.message);
    throw err;
  }
}

// 圖片嵌入 => { embedding: [...] }
async function embedImage(imageUrl) {
  try {
    const url = `http://${VECTOR_SERVICE_HOST}:${VECTOR_SERVICE_PORT}/api/v1/image-embed`;
    const resp = await axios.post(url, { image_url: imageUrl });
    return resp.data; // { embedding: [...] }
  } catch (err) {
    console.error('[embedImage] error:', err.message);
    throw err;
  }
}

// 搜索相似圖片 (遠端 URL) => { results: [ { url, score }, ... ] }
async function searchImage(imageUrl, topK = 5) {
  try {
    const url = `http://${VECTOR_SERVICE_HOST}:${VECTOR_SERVICE_PORT}/api/v1/image-search`;
    const resp = await axios.post(url, {
      image_url: imageUrl,
      top_k: topK
    });
    return resp.data; // { results: [ { url, score }, ... ] }
  } catch (err) {
    console.error('[searchImage] error:', err.message);
    throw err;
  }
}

// 插入圖片 => { status:"ok", insert_count:1 }
async function insertImage(imageUrl) {
  try {
    const url = `http://${VECTOR_SERVICE_HOST}:${VECTOR_SERVICE_PORT}/api/v1/image-insert`;
    const resp = await axios.post(url, { image_url: imageUrl });
    return resp.data;
  } catch (err) {
    console.error('[insertImage] error:', err.message);
    throw err;
  }
}

/**
 * ★ 新增：searchLocalImage
 *  用於「讀取本機檔案」並上傳 base64 → Python 微服務 `/api/v1/image-search`
 *  回傳格式與 searchImage 相同 => { results: [ { url, score }, ... ] }
 */
async function searchLocalImage(localFilePath, topK = 5) {
  try {
    // 1) 讀取本機檔案 → to base64
    const fileBuf = fs.readFileSync(localFilePath);
    const base64Str = fileBuf.toString('base64');

    // 2) 發送至 Python：以 image_base64 參數 (微服務若支援則可直接使用)
    const url = `http://${VECTOR_SERVICE_HOST}:${VECTOR_SERVICE_PORT}/api/v1/image-search`;
    const resp = await axios.post(url, {
      image_base64: base64Str,
      top_k: topK
    });
    return resp.data; // { results: [ { url, score }, ... ] }
  } catch (err) {
    console.error('[searchLocalImage] error:', err.message);
    throw err;
  }
}

module.exports = {
  embedText,
  embedImage,
  searchImage,
  insertImage,
  // ★ 新增：
  searchLocalImage
};
