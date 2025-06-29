// express/services/tineye.service.js (Corrected Signature Generation)
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { fromBuffer } = require('file-type'); // Correct way to import for v16

const TINEYE_API_KEY = process.env.TINEYE_API_KEY; // This is the PRIVATE key
const TINEYE_API_URL = 'https://api.tineye.com/rest/search/';

/**
 * Generates the required HMAC-SHA256 signature for TinEye API requests.
 * @param {string} requestMethod - The HTTP method, e.g., 'POST'.
 * @param {string} nonce - A unique random string for this request.
 * @param {string} date - The current timestamp in seconds.
 * @param {object} params - The query parameters for the request.
 * @returns {string} The calculated hex signature.
 */
function generateSignature(requestMethod, nonce, date, params) {
  const apiKey = TINEYE_API_KEY;
  if (!apiKey) {
    throw new Error('TINEYE_API_KEY is not defined.');
  }

  const api_url_path = '/rest/search/';
  const request_url = `https://api.tineye.com${api_url_path}`;
  
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');

  const toSign = [
    apiKey,
    requestMethod,
    '', // Content-Type is part of the form, not signed here
    '', // Image data is not signed directly
    date,
    nonce,
    request_url,
    sortedParams
  ].join('');

  const signature = crypto
    .createHmac('sha256', apiKey)
    .update(toSign)
    .digest('hex');

  return signature;
}

/**
 * Searches for matches using the TinEye API with a given image buffer.
 * @param {Buffer} buffer - The image file buffer.
 * @returns {Promise<object>} - An object containing the scan results.
 */
async function searchByBuffer(buffer) {
    if (!TINEYE_API_KEY) {
        logger.warn('[TinEye Service] TINEYE_API_KEY is not configured. Service disabled.');
        return { success: false, matches: [], error: 'TinEye API key not configured.' };
    }
    if (!buffer || buffer.length === 0) {
        logger.error('[TinEye Service] searchByBuffer was called with an empty or invalid buffer.');
        return { success: false, matches: [], error: 'Invalid image buffer provided.' };
    }

    try {
        const imageType = await fromBuffer(buffer);
        if (!imageType) {
            logger.error('[TinEye Service] Could not determine file type from buffer.');
            return { success: false, matches: [], error: 'Could not determine file type.' };
        }
        const { mime, ext } = imageType;

        logger.info(`[TinEye Service] Starting search by image buffer (size: ${buffer.length} bytes, type: ${mime})...`);
        
        const form = new FormData();
        form.append('image', buffer, {
            filename: `upload.${ext}`,
            contentType: mime
        });

        // --- Signature Generation ---
        const nonce = crypto.randomBytes(12).toString('hex');
        const date = Math.floor(new Date().getTime() / 1000).toString();
        
        const queryParams = {
            limit: 100,
            offset: 0,
            sort: 'score',
            min_score: 0,
            image_count: 0, // This is a required parameter for signing, even if it's 0
        };

        const signature = generateSignature('POST', nonce, date, queryParams);
        
        const requestUrl = `${TINEYE_API_URL}?limit=${queryParams.limit}&offset=${queryParams.offset}&sort=${queryParams.sort}&min_score=${queryParams.min_score}&image_count=${queryParams.image_count}&date=${date}&nonce=${nonce}&api_sig=${signature}`;
        
        const headers = {
            ...form.getHeaders(),
            'User-Agent': 'SooZoo Kaizoku Hunter/1.2'
        };

        const response = await axios.post(requestUrl, form, {
            headers,
            timeout: 30000
        });

        const matches = Array.isArray(response.data?.results?.matches)
            ? response.data.results.matches
            : [];
        
        const results = matches.map(match => ({
            url: match.image_url,
            type: 'Match',
            source: 'TinEye',
            backlinks: Array.isArray(match.backlinks) ? match.backlinks.map(link => link.url) : []
        }));

        logger.info(`[TinEye Service] Search complete. Found ${results.length} matches.`);
        return { success: true, matches: results, error: null };

    } catch (error) {
        if (error.response) {
            logger.error(`[TinEye Service] API Error Status: ${error.response.status}`);
            logger.error('[TinEye Service] API Error Data:', error.response.data || '(empty)');
            const errorMessage = JSON.stringify(error.response.data) || `HTTP ${error.response.status}`;
            return { success: false, matches: [], error: errorMessage };
        } else if (error.request) {
            logger.error('[TinEye Service] No response received from API server.', error);
            return { success: false, matches: [], error: 'No response from TinEye API.' };
        } else {
            logger.error('[TinEye Service] Request setup error:', error.message);
            return { success: false, matches: [], error: error.message };
        }
    }
}

module.exports = {
    searchByBuffer,
};
