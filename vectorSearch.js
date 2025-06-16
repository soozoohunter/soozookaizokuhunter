// express/utils/vectorSearch.js
// 與 Python Towhee+Milvus 微服務溝通

const fs = require('fs');
const axios = require('axios');

// 服務位置可由環境變數覆蓋，預設為 docker-compose 中的 container name
const VECTOR_SERVICE_BASE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://suzoo_python_vector:8000';

const INDEX_ENDPOINT = `${VECTOR_SERVICE_BASE_URL}/api/v1/image-insert`;
const SEARCH_ENDPOINT = `${VECTOR_SERVICE_BASE_URL}/api/v1/image-search`;

// 將單張圖片索引到 Milvus
async function indexImageVector(localImagePath, fileId) {
  try {
    const imageBase64 = fs.readFileSync(localImagePath, { encoding: 'base64' });
    const body = { image_base64: imageBase64, id: fileId };

    const res = await axios.post(
      INDEX_ENDPOINT,
      body,
      { timeout: 30000 }
    );
    console.log('[indexImageVector] success =>', res.data);
    return res.data;
  } catch (err) {
    console.error('[indexImageVector] error =>', err.message);
    return null;
  }
}

// 用來搜尋相似圖片 (Top-K)
async function searchImageByVector(localImagePath, options={}) {
  try {
    const imageBase64 = fs.readFileSync(localImagePath, { encoding: 'base64' });
    const body = {
      image_base64: imageBase64,
      top_k: options.topK || 3,
    };
    if(options.modelName) body.model_name = options.modelName;

    const res = await axios.post(
      SEARCH_ENDPOINT,
      body,
      { timeout: 30000 }
    );
    console.log('[searchImageByVector] success =>', res.data);
    return res.data;
  } catch (err) {
    console.error('[searchImageByVector] error =>', err.message);
    return null;
  }
}

module.exports = { indexImageVector, searchImageByVector };
