// File: express/services/vectorSearch.js
const axios = require('axios');

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

// 搜索相似圖片 => { results: [ { url, score }, ... ] }
async function searchImage(imageUrl, topK=5) {
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

module.exports = {
  embedText,
  embedImage,
  searchImage,
  insertImage,
};
