// express/services/bing.service.js (v3.0 - Direct Request)
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

const BING_API_KEY = process.env.BING_API_KEY ? process.env.BING_API_KEY.trim() : '';
const BING_ENDPOINT = process.env.BING_ENDPOINT;

async function searchByBuffer(buffer) {
  if (!BING_API_KEY || !BING_ENDPOINT) {
    logger.warn('[Bing Service] BING_API_KEY or BING_ENDPOINT is not configured. Service disabled.');
    return { success: false, links: [], error: 'Bing API key or endpoint not configured.' };
  }
  if (!/^[A-Fa-f0-9]{32}$/.test(BING_API_KEY)) {
    logger.error('[Bing Service] Invalid API key format.');
    return { success: false, links: [], error: 'Invalid Bing API key format.' };
  }
  if (!buffer) {
    return { success: false, links: [], error: 'Invalid image buffer provided.' };
  }

  // [核心修正] 直接寫死完整的 API 端點路徑，避免任何組合錯誤
  const fullUrl = 'https://api.bing.microsoft.com/v7.0/images/visualsearch';
  
  const form = new FormData();
  form.append('image', buffer, { filename: 'upload.jpg' });

  const headers = {
    ...form.getHeaders(),
    'Ocp-Apim-Subscription-Key': BING_API_KEY,
  };
  
  logger.info(`[Bing Service] Sending request to: ${fullUrl}`);

  try {
    const response = await axios.post(fullUrl, form, { headers, timeout: 30000 });
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
    logger.error(`[Bing Service] Search failed with status ${status}: ${errorMsg}`);
    return { success: false, links: [], error: errorMsg };
  }
}

module.exports = { searchByBuffer };
