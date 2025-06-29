// express/services/tineye.service.js (Final Corrected Version)
const TinEye = require('tineye-api');
const logger = require('../utils/logger');

const TINEYE_PUBLIC_KEY = process.env.TINEYE_PUBLIC_KEY;
const TINEYE_PRIVATE_KEY = process.env.TINEYE_PRIVATE_KEY;
const TINEYE_API_URL = 'https://api.tineye.com/rest/';

let api;
// Initialize the client only if both keys are present
if (TINEYE_PRIVATE_KEY && TINEYE_PUBLIC_KEY) {
    api = new TinEye(TINEYE_API_URL, TINEYE_PUBLIC_KEY, TINEYE_PRIVATE_KEY);
} else {
    logger.warn('[TinEye Service] TINEYE_PUBLIC_KEY or TINEYE_PRIVATE_KEY is not configured in .env file. Service will be disabled.');
}

/**
 * Searches for matches using the TinEye API with a given image buffer.
 * @param {Buffer} buffer - The image file buffer.
 * @returns {Promise<object>} - An object containing the scan results.
 */
async function searchByBuffer(buffer) {
    if (!api) {
        return { success: false, matches: [], error: 'TinEye Service is not configured.' };
    }
    if (!buffer || buffer.length === 0) {
        logger.error('[TinEye Service] searchByBuffer was called with an empty or invalid buffer.');
        return { success: false, matches: [], error: 'Invalid image buffer provided.' };
    }

    logger.info(`[TinEye Service] Starting search by image buffer (size: ${buffer.length} bytes)...`);

    try {
        // **FIX**: The searchData method only requires the buffer.
        // The second argument is an options object, not a filename string.
        const response = await api.searchData(buffer);

        const rawMatches = response.results?.matches || [];
        
        const results = rawMatches.map(match => ({
            url: match.image_url,
            type: 'Match',
            source: 'TinEye',
            backlinks: Array.isArray(match.backlinks) ? match.backlinks.map(link => link.url) : []
        }));

        logger.info(`[TinEye Service] Search complete. Found ${results.length} matches.`);
        return { success: true, matches: results, error: null };

    } catch (error) {
        // The official library throws detailed errors
        logger.error('[TinEye Service] Search failed:', error);
        return { success: false, matches: [], error: error.message || 'An unknown error occurred during TinEye search.' };
    }
}

module.exports = {
    searchByBuffer,
};
