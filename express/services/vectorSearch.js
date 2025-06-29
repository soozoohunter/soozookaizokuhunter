// express/services/vectorSearch.js (Corrected Environment Variable)
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const logger = require('../utils/logger');

// **FIX**: Use the correct environment variable 'VECTOR_SERVICE_URL'
const VECTOR_URL = process.env.VECTOR_SERVICE_URL || 'http://suzoo_fastapi:8000';

async function indexImage(imageInput, id) {
  const form = new FormData();

  if (Buffer.isBuffer(imageInput)) {
    form.append('image', imageInput, { filename: `image-${id}.jpg` });
  } else if (typeof imageInput === 'string') {
    form.append('image', fs.createReadStream(imageInput));
  } else {
    throw new Error('Invalid imageInput type for indexImage. Must be a buffer or file path.');
  }
  form.append('id', String(id));

  const url = `${VECTOR_URL}/api/v1/image-insert`;
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

async function searchLocalImage(imageInput, topK = 5) {
  const form = new FormData();
  if (Buffer.isBuffer(imageInput)) {
    form.append('image', imageInput, { filename: 'search.jpg' });
  } else if (typeof imageInput === 'string') {
    form.append('image', fs.createReadStream(imageInput));
  } else {
    throw new Error('Invalid imageInput type for searchLocalImage. Must be a buffer or file path.');
  }
  form.append('top_k', topK.toString());

  const url = `${VECTOR_URL}/api/v1/image-search`;
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
