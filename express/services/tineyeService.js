require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const TINEYE_ENDPOINT = process.env.TINEYE_API_URL || 'https://api.tineye.com/rest/search/';

/**
 * Search TinEye API with a remote image URL.
 * @param {string} imageUrl - URL of the image to search.
 * @returns {Promise<Array<{url:string, score:number, source:string}>>}
 */
async function searchTinEyeApi(imageUrl) {
  const apiKey = process.env.TINEYE_API_KEY;
  if (!apiKey) {
    throw new Error('TINEYE_API_KEY is not set');
  }
  if (!imageUrl) {
    throw new Error('imageUrl is required');
  }

  try {
    const resp = await axios.get(TINEYE_ENDPOINT, {
      params: {
        image_url: imageUrl,
        api_key: apiKey
      },
      timeout: 10000
    });

    const data = resp.data;
    // support both 'results.matches' and 'result.matches'
    const matches = Array.isArray(data.results?.matches)
      ? data.results.matches
      : Array.isArray(data.result?.matches)
        ? data.result.matches
        : [];

    return matches.map(m => ({
      url: m.backlinks?.[0]?.url || '',
      score: m.score,
      source: m.domain || m.image_url || ''
    }));
  } catch (err) {
    console.error('[TinEye API] error:', err.message);
    throw err;
  }
}

/**
 * Search TinEye API with an image buffer.
 * @param {Buffer} buffer - Image data buffer.
 * @returns {Promise<Array<{url:string, score:number, source:string}>>}
 */
async function searchByBuffer(buffer) {
  const apiKey = process.env.TINEYE_API_KEY;
  if (!apiKey) throw new Error('TINEYE_API_KEY is not set');
  if (!buffer) throw new Error('buffer required');

  const form = new FormData();
  form.append('image_upload', buffer, { filename: 'upload.jpg' });

  try {
    const resp = await axios.post(TINEYE_ENDPOINT, form, {
      headers: { ...form.getHeaders(), 'X-API-Key': apiKey },
      timeout: 10000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    const data = resp.data;
    const matches = Array.isArray(data.results?.matches)
      ? data.results.matches
      : Array.isArray(data.result?.matches)
        ? data.result.matches
        : [];
    return matches.map(m => ({
      url: m.backlinks?.[0]?.url || '',
      score: m.score,
      source: m.domain || m.image_url || ''
    }));
  } catch (err) {
    console.error('[TinEye API] error:', err.message);
    throw err;
  }
}

module.exports = { searchTinEyeApi, searchByBuffer };
