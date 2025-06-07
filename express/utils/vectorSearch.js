/**
 * express/utils/vectorSearch.js
 *
 * 與 Python 向量檢索服務 (FastAPI+Milvus) 溝通。
 */
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// 可以透過環境變數覆蓋服務 URL，預設使用 docker-compose 內的 container name
const PYTHON_VECTOR_SERVICE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://suzoo_python_vector:8000';
const INDEX_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/index`;
const SEARCH_ENDPOINT = `${PYTHON_VECTOR_SERVICE_URL}/api/v1/search`;

async function indexImageVector(localImagePath, fileId, options={}) {
  if(!fs.existsSync(localImagePath)){
    console.warn('[indexImageVector] file not found =>', localImagePath);
    return null;
  }
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(localImagePath));
    form.append('id', fileId.toString());
    if(options.modelName) form.append('modelName', options.modelName);

    const res = await axios.post(INDEX_ENDPOINT, form, {
      headers: form.getHeaders(),
      timeout:30000
    });
    console.log('[indexImageVector] =>', res.data);
    return res.data;
  } catch(e){
    console.error('[indexImageVector] error =>', e.message);
    return null;
  }
}

async function searchImageByVector(localImagePath, options={}) {
  if(!fs.existsSync(localImagePath)){
    console.warn('[searchImageByVector] file not found =>', localImagePath);
    return null;
  }
  const { topK=3, modelName } = options;
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(localImagePath));
    form.append('topK', `${topK}`);
    if(modelName) form.append('modelName', modelName);

    const res = await axios.post(SEARCH_ENDPOINT, form, {
      headers: form.getHeaders(),
      timeout:30000
    });
    console.log('[searchImageByVector] =>', res.data);
    return res.data;
  } catch(e){
    console.error('[searchImageByVector] error =>', e.message);
    return null;
  }
}

module.exports = {
  indexImageVector,
  searchImageByVector
};
