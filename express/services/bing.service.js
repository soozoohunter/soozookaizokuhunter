// express/services/bing.service.js (Final Endpoint Corrected & Hardened)
const axios = require('axios');
const FormData = require('form-data');
const { URL } = require('url'); // Import URL for robust path joining
const logger = require('../utils/logger');

const BING_API_KEY = process.env.BING_API_KEY;
// Optional secondary key allows seamless rollover if the primary key fails
const BING_API_KEY2 = process.env.BING_API_KEY2 || process.env.BING_API_KEY_2;
const BING_API_ENDPOINT = process.env.BING_API_ENDPOINT;

async function searchByBuffer(buffer) {
  if (!BING_API_ENDPOINT || (!BING_API_KEY && !BING_API_KEY2)) {
    logger.warn('[Bing Service] BING_API_KEY/BING_API_KEY2 or BING_API_ENDPOINT is not configured. Service disabled.');
    return { success: false, links: [], error: 'Bing API credentials not configured.' };
  }
  if (!buffer) {
    return { success: false, links: [], error: 'Invalid image buffer provided.' };
  }

  logger.info(`[Bing Service] Starting search by image buffer (size: ${buffer.length} bytes)...`);

  const attempt = async (apiKey) => {
    const form = new FormData();
    form.append('image', buffer, { filename: 'upload.jpg' });

    const headers = {
      ...form.getHeaders(),
      'Ocp-Apim-Subscription-Key': apiKey,
    };

    const endpointUrl = new URL(BING_API_ENDPOINT);
    // When using an Azure multi-service endpoint, Bing APIs require the '/bing' prefix
    let basePath = endpointUrl.pathname.replace(/\/+$/, '');
    if (basePath.includes('/bing')) {
      endpointUrl.pathname = `${basePath}/v7.0/images/visualsearch`;
    } else {
      endpointUrl.pathname = `${basePath}/bing/v7.0/images/visualsearch`;
    }
    endpointUrl.searchParams.set('modules', 'SimilarImages');

    const fullUrl = endpointUrl.href;

    const response = await axios.post(fullUrl, form, { headers, timeout: 30000 });
    const rawMatches = response.data?.similarImages?.value || [];
    const links = rawMatches.map((match) => match.hostPageUrl).filter(Boolean);
    const uniqueLinks = [...new Set(links)];
    logger.info(`[Bing Service] Search complete using provided key. Found ${uniqueLinks.length} unique links.`);
    return { success: true, links: uniqueLinks, error: null };
  };

  const apiKeys = [BING_API_KEY, BING_API_KEY2].filter(Boolean);
  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      return await attempt(apiKeys[i]);
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message || 'Unknown error';
      logger.error(`[Bing Service] Attempt ${i + 1} failed: ${errorMsg}`);
      lastError = errorMsg;
    }
  }

  return { success: false, links: [], error: lastError || 'Failed to search image with Bing' };
}

module.exports = {
  searchByBuffer,
};
