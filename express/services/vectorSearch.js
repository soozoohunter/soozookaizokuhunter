const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const logger = require('../utils/logger'); // 引入 logger

const PYTHON_VECTOR_URL = process.env.PYTHON_VECTOR_URL || 'http://suzoo_python_vector:8000';

async function indexImage(localFilePath, id) {
  const form = new FormData();
  form.append('image', fs.createReadStream(localFilePath));
  form.append('id', String(id));

  const url = `${PYTHON_VECTOR_URL}/api/v1/image-insert`;
  logger.info(`[VectorSearch] Sending index request for ID ${id} to ${url}`);

  try {
    const resp = await axios.post(url, form, {
      headers: { 
        ...form.getHeaders() 
      },
      timeout: 10000
    });
    logger.info(`[VectorSearch] Index request for ID ${id} successful. Response:`, resp.data);
    return resp.data;
  } catch (err) {
    const errorSource = err.response ? 'server' : (err.request ? 'network' : 'request_setup');
    const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
    logger.error(`[VectorSearch] indexImage failed for ID ${id}. Source: ${errorSource}.`, {
        message: err.message,
        url: url,
        detail: errorDetail,
        axiosError: err.toJSON()
    });
    throw new Error(`Vector service failed to index image (ID: ${id}): ${errorDetail}`);
  }
}

async function searchLocalImage(localFilePath, topK = 5) {
  const form = new FormData();
  form.append('image', fs.createReadStream(localFilePath));
  form.append('top_k', topK.toString());

  const url = `${PYTHON_VECTOR_URL}/api/v1/image-search`;
  logger.info(`[VectorSearch] Sending search request to ${url} with topK=${topK}`);
  try {
    const resp = await axios.post(url, form, {
      headers: { 
        ...form.getHeaders() 
      },
      timeout: 10000
    });
    logger.info(`[VectorSearch] Search request successful. Found ${resp.data?.results?.length || 0} results.`);
    return resp.data;
  } catch (err) {
    const errorSource = err.response ? 'server' : (err.request ? 'network' : 'request_setup');
    const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
    logger.error(`[VectorSearch] searchLocalImage failed. Source: ${errorSource}.`, {
        message: err.message,
        url: url,
        detail: errorDetail,
        axiosError: err.toJSON()
    });
    throw new Error(`Vector service failed to search image: ${errorDetail}`);
  }
}

module.exports = {
  indexImage,
  searchLocalImage
};
