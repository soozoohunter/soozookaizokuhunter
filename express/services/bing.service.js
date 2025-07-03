// express/services/bing.service.js (最終修正版)
const axios = require('axios');
const FormData = require('form-data');
const { URL } = require('url');
const logger = require('../utils/logger');

const BING_API_KEY = process.env.BING_API_KEY;
const BING_API_ENDPOINT = process.env.BING_API_ENDPOINT;

async function searchByBuffer(buffer) {
  if (!BING_API_KEY || !BING_API_ENDPOINT) {
    logger.warn('[Bing Service] BING_API_KEY or BING_API_ENDPOINT is not configured. Service disabled.');
    return { success: false, links: [], error: 'Bing API key or endpoint not configured.' };
  }
  if (!buffer) {
    return { success: false, links: [], error: 'Invalid image buffer provided.' };
  }

  logger.info(`[Bing Service] Starting search by image buffer (size: ${buffer.length} bytes)...`);

  // 直接建構視覺化搜尋的完整 URL
  const fullUrl = new URL('/bing/v7.0/images/visualsearch', BING_API_ENDPOINT).href;
  
  const form = new FormData();
  form.append('image', buffer, { filename: 'upload.jpg' });

  const headers = {
    ...form.getHeaders(),
    'Ocp-Apim-Subscription-Key': BING_API_KEY,
  };
  
  logger.info(`[Bing Service] Sending request to: ${fullUrl}`);

  try {
    const response = await axios.post(fullUrl, form, { headers, timeout: 30000 });
    const rawMatches = response.data?.similarImages?.value || [];
    const links = rawMatches.map((match) => match.hostPageUrl).filter(Boolean);
    const uniqueLinks = [...new Set(links)];

    logger.info(`[Bing Service] Search complete. Found ${uniqueLinks.length} unique links.`);
    return { success: true, links: uniqueLinks, error: null };
  } catch (error) {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.error?.message || error.message || 'An unknown error occurred';
    
    logger.error(`[Bing Service] Search failed with status ${status}: ${errorMsg}`, {
      status: status,
      url: fullUrl,
      responseData: error.response?.data,
    });

    let userFriendlyError = errorMsg;
    if (status === 404) {
        userFriendlyError = 'Resource not found. Please verify BING_API_ENDPOINT in your .env file.';
    } else if (status === 401 || status === 403) {
        userFriendlyError = 'Authentication failed. Please verify BING_API_KEY in your .env file.';
    }

    return { success: false, links: [], error: userFriendlyError };
  }
}

module.exports = {
  searchByBuffer,
};
