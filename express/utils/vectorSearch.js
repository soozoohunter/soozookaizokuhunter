/**
 * express/utils/vectorSearch.js
 * - 與您部署的「Python 向量檢索微服務」(Towhee + Milvus) 溝通
 * - 假設該微服務的 Base URL 為 http://python-vector-service:8000
 * - 需先安裝 form-data (npm install form-data) / axios (npm install axios)
 */
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function indexImageVector(localImagePath, fileId) {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(localImagePath));
    form.append('id', fileId.toString());

    const res = await axios.post(
      'http://python-vector-service:8000/api/v1/index', // 替換為實際微服務位置
      form, 
      { headers: form.getHeaders(), timeout: 30000 }
    );
    console.log('[indexImageVector] success =>', res.data);
    return res.data;
  } catch (error) {
    console.error('[indexImageVector] error =>', error.message);
    return null;
  }
}

async function searchImageByVector(localImagePath, options = {}) {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(localImagePath));
    if(options.topK) form.append('topK', String(options.topK));
    if(options.modelName) form.append('modelName', options.modelName);

    const res = await axios.post(
      'http://python-vector-service:8000/api/v1/search',
      form,
      { headers: form.getHeaders(), timeout: 30000 }
    );
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
