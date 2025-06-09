const axios = require('axios');

const TINEYE_ENDPOINT = 'https://api.tineye.com/rest/search/';

/**
 * Query the TinEye API for matches.
 * @param {string} imageUrl - URL of the image to search.
 * @returns {Promise<Array<{url:string, score:number, source:string}>>}
 */
async function searchTinEyeApi(imageUrl) {
  const apiKey = process.env.TINEYE_API_KEY;
  if (!apiKey) {
    throw new Error('TINEYE_API_KEY is not set');
  }

  try {
    const { data } = await axios.get(TINEYE_ENDPOINT, {
      params: { image_url: imageUrl, api_key: apiKey }
    });

    const matches = ((data || {}).results || {}).matches || [];
    return matches.map(m => ({
      url: (m.backlinks && m.backlinks[0] && m.backlinks[0].url) || '',
      score: m.score,
      source: m.domain || m.site
    }));
  } catch (err) {
    console.error('[TinEye API] error:', err.message);
    throw err;
  }
}

module.exports = { searchTinEyeApi };
