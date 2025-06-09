require('dotenv').config();
const axios = require('axios');

const API_URL = 'https://api.tineye.com/rest/search/';

/**
 * Search TinEye API with a remote image URL.
 * @param {string} imageUrl
 * @returns {Promise<Array<{url:string, score:number, source:string}>>}
 */
async function searchTinEyeApi(imageUrl){
  const apiKey = process.env.TINEYE_API_KEY;
  if(!apiKey){
    throw new Error('TINEYE_API_KEY not set');
  }
  if(!imageUrl){
    throw new Error('imageUrl is required');
  }

  const resp = await axios.get(API_URL, {
    params: {
      image_url: imageUrl,
      api_key: apiKey
    },
    timeout: 10000
  });

  const matches = resp.data && resp.data.result && Array.isArray(resp.data.result.matches)
    ? resp.data.result.matches
    : [];

  return matches.map(m => ({
    url: m.backlinks && m.backlinks[0] && m.backlinks[0].url ? m.backlinks[0].url : '',
    score: m.score,
    source: m.image_url
  }));
}

module.exports = { searchTinEyeApi };
