// express/utils/vectorSearch.js
// 與 Python Towhee+Milvus 微服務溝通

const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

// 服務位置可由環境變數覆蓋，預設為 docker-compose 中的 container name
const VECTOR_SERVICE_BASE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://suzoo_python_vector:8000';

// 將單張圖片索引到 Milvus
async function indexImageVector(localImagePath, fileId) {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(localImagePath));
    form.append('id', fileId.toString());

    const res = await axios.post(
      `${VECTOR_SERVICE_BASE_URL}/api/v1/index`,
      form,
      { headers: form.getHeaders(), timeout:30000 }
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
    const form = new FormData();
    form.append('image', fs.createReadStream(localImagePath));
    if(options.topK) form.append('topK', String(options.topK));
    if(options.modelName) form.append('modelName', options.modelName);

    const res = await axios.post(
      `${VECTOR_SERVICE_BASE_URL}/api/v1/search`,
      form,
      { headers: form.getHeaders(), timeout:30000 }
    );
    console.log('[searchImageByVector] success =>', res.data);
    return res.data;
  } catch (err) {
    console.error('[searchImageByVector] error =>', err.message);
    return null;
  }
}

module.exports = { indexImageVector, searchImageByVector };
