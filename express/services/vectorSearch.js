const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const logger = require('../utils/logger'); // 引入 logger

const PYTHON_VECTOR_URL = process.env.PYTHON_VECTOR_URL || 'http://suzoo_python_vector:8000';

async function indexImage(localFilePath, id) {
  const form = new FormData();
  form.append('image', fs.createReadStream(localFilePath));
  form.append('id', id);

  try {
    const url = `${PYTHON_VECTOR_URL}/api/v1/image-insert`;
    logger.info(`[VectorSearch] Sending index request for ID ${id} to ${url}`);
    const resp = await axios.post(url, form, {
      headers: { ...form.getHeaders() }
    });
    logger.info(`[VectorSearch] Index request for ID ${id} successful.`);
    return resp.data;
  } catch (err) {
    const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
    // Log full error object for better diagnostics
    logger.error(`[VectorSearch] indexImage failed for ID ${id}.`, err);
    logger.error(`[VectorSearch] indexImage error detail: ${errorDetail}`);
    throw new Error(`Vector service failed to index image: ${errorDetail}`);
  }
}

async function searchLocalImage(localFilePath, topK = 5) {
  const form = new FormData();
  form.append('image', fs.createReadStream(localFilePath));
  form.append('top_k', topK.toString());

  try {
    const url = `${PYTHON_VECTOR_URL}/api/v1/image-search`;
    logger.info(`[VectorSearch] Sending search request to ${url}`);
    const resp = await axios.post(url, form, {
      headers: { ...form.getHeaders() }
    });
    logger.info(`[VectorSearch] Search request successful.`);
    return resp.data;
  } catch (err) {
    const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
    // Log full error object for better diagnostics
    logger.error('[VectorSearch] searchLocalImage failed:', err);
    logger.error(`[VectorSearch] searchLocalImage error detail: ${errorDetail}`);
    throw new Error(`Vector service failed to search image: ${errorDetail}`);
  }
}

module.exports = {
  indexImage,
  searchLocalImage
};
