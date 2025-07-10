// express/services/bing.service.js (最終修正版)
const axios = require('axios');
const FormData = require('form-data');
const { URL } = require('url');
const logger = require('../utils/logger');

const BING_API_KEY = process.env.BING_API_KEY;
const BING_ENDPOINT = process.env.BING_ENDPOINT; // e.g., https://api.bing.microsoft.com

async function searchByBuffer(buffer) {
  if (!BING_API_KEY || !BING_ENDPOINT) {
    logger.warn('[Bing Service] BING_API_KEY or BING_ENDPOINT is not configured. Service disabled.');
    return { success: false, links: [], error: 'Bing API key or endpoint not configured.' };
  }
  if (!buffer) {
    return { success: false, links: [], error: 'Invalid image buffer provided.' };
  }

  logger.info(`[Bing Service] Starting search by image buffer (size: ${buffer.length} bytes)...`);

  // [修正] 正確組合 API 端點 URL
  const fullUrl = new URL('/v7.0/images/visualsearch', BING_ENDPOINT).href;
  
  const form = new FormData();
  form.append('image', buffer, { filename: 'upload.jpg' });

  const headers = {
    ...form.getHeaders(),
    'Ocp-Apim-Subscription-Key': BING_API_KEY,
  };
  
  logger.info(`[Bing Service] Sending request to: ${fullUrl}`);

  try {
    const response = await axios.post(fullUrl, form, { headers, timeout: 30000 });
    // [修正] 更穩健的結果解析
    const tags = response.data?.tags || [];
    const actions = tags.flatMap(tag => tag.actions || []);
    const pages = actions.filter(action => action.actionType === 'PagesIncluding').flatMap(action => action.data?.value || []);
    const links = pages.map((page) => page.hostPageUrl).filter(Boolean);
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
    if (status === 401 || status === 403) {
        userFriendlyError = 'Authentication failed. Please verify BING_API_KEY in your .env file.';
    }

    return { success: false, links: [], error: userFriendlyError };
  }
}

module.exports = {
  searchByBuffer,
};
