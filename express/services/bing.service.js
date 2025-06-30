// express/services/bing.service.js
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

const BING_API_KEY = process.env.BING_API_KEY;
// Read the custom endpoint from .env file
const BING_API_ENDPOINT = process.env.BING_API_ENDPOINT;

/**
 * Searches for similar images using the Bing Image Search API with a given image buffer.
 * @param {Buffer} buffer - The image file buffer.
 * @returns {Promise<object>} - An object containing the scan results.
 */
async function searchByBuffer(buffer) {
    if (!BING_API_KEY || !BING_API_ENDPOINT) {
        logger.warn('[Bing Service] BING_API_KEY or BING_API_ENDPOINT is not configured. Service disabled.');
        return { success: false, links: [], error: 'Bing API key or endpoint not configured.' };
    }
    if (!buffer || buffer.length === 0) {
        logger.error('[Bing Service] searchByBuffer was called with an empty or invalid buffer.');
        return { success: false, links: [], error: 'Invalid image buffer provided.' };
    }

    logger.info(`[Bing Service] Starting search by image buffer (size: ${buffer.length} bytes)...`);
    
    const form = new FormData();
    form.append('image', buffer, { filename: 'upload.jpg' });

    const headers = {
        ...form.getHeaders(),
        'Ocp-Apim-Subscription-Key': BING_API_KEY,
    };
    
    // Construct the full URL for the request
    const fullUrl = `${BING_API_ENDPOINT}/bing/v7.0/images/search`;
    
    const params = {
        modules: 'SimilarImages',
    };

    try {
        const response = await axios.post(fullUrl, form, {
            headers,
            params,
            timeout: 30000,
        });

        const rawMatches = response.data?.similarImages?.value || [];
        
        const links = rawMatches.map(match => match.hostPageUrl).filter(Boolean);
        const uniqueLinks = [...new Set(links)];

        logger.info(`[Bing Service] Search complete. Found ${uniqueLinks.length} unique links.`);
        return { success: true, links: uniqueLinks, error: null };

    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        logger.error(`[Bing Service] Search failed: ${errorMsg}`);
        if (error.response) {
            logger.error(`[Bing Service] API Error Status: ${error.response.status}`);
        }
        return { success: false, links: [], error: errorMsg };
    }
}

module.exports = {
    searchByBuffer,
};
