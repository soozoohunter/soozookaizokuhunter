// express/services/bing.service.js (Final Endpoint Corrected & Hardened)
const axios = require('axios');
const FormData = require('form-data');
const { URL } = require('url'); // Import URL for robust path joining
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
    
    const form = new FormData();
    form.append('image', buffer, { filename: 'upload.jpg' });

    const headers = {
        ...form.getHeaders(),
        'Ocp-Apim-Subscription-Key': BING_API_KEY,
    };
    
    // NOTE: When using an Azure multi-service endpoint, Bing APIs require the
    // '/bing' path prefix. Without it the service responds with `Resource not
    // found` (HTTP 404).
    // Ref: https://learn.microsoft.com/azure/ai-services/bing-search/bing-search-api-endpoint
    const endpointUrl = new URL(BING_API_ENDPOINT);
    endpointUrl.pathname = '/bing/v7.0/images/search'; // correct path for multi-service
    endpointUrl.searchParams.set('modules', 'SimilarImages');
    
    const fullUrl = endpointUrl.href;

    try {
        const response = await axios.post(fullUrl, form, { headers, timeout: 30000 });
        const rawMatches = response.data?.similarImages?.value || [];
        const links = rawMatches.map(match => match.hostPageUrl).filter(Boolean);
        const uniqueLinks = [...new Set(links)];

        logger.info(`[Bing Service] Search complete. Found ${uniqueLinks.length} unique links.`);
        return { success: true, links: uniqueLinks, error: null };

    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || 'An unknown error occurred';
        logger.error(`[Bing Service] Search failed: ${errorMsg}`, { 
            status: error.response?.status, 
            url: fullUrl,
            // Log the response body from Bing if available, it often contains hints.
            responseData: error.response?.data 
        });
        return { success: false, links: [], error: errorMsg };
    }
}

module.exports = {
    searchByBuffer,
};
