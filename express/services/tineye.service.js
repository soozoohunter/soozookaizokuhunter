// express/services/tineye.service.js
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');
// **FIX**: 引入 file-type
const { fileTypeFromBuffer } = require('file-type');

const TINEYE_API_KEY = process.env.TINEYE_API_KEY;
const TINEYE_API_URL = 'https://api.tineye.com/rest/search';

/**
 * 使用 TinEye API 透過圖片 buffer 來搜尋匹配項。
 * @param {Buffer} buffer - 圖片的檔案緩衝區。
 * @returns {Promise<object>} - 包含掃描結果的物件。
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

    // **FIX**: 動態偵測 MIME 類型
    const type = await fileTypeFromBuffer(buffer);
    if (!type) {
        logger.error('[TinEye Service] Could not determine file type from buffer.');
        return { success: false, matches: [], error: 'Could not determine file type.' };
    }
    const { mime, ext } = type;

    logger.info(`[TinEye Service] Starting search by image buffer (size: ${buffer.length} bytes, type: ${mime})...`);
    const form = new FormData();
    form.append('image', buffer, {
        filename: `upload.${ext}`,
        contentType: mime
    });

    const headers = {
        ...form.getHeaders(),
        'X-Api-Key': TINEYE_API_KEY,
        'User-Agent': 'SooZoo Kaizoku Hunter/1.0'
    };

    try {
        const response = await axios.post(TINEYE_API_URL, form, {
            headers,
            timeout: 20000
        });

        const matches = Array.isArray(response.data?.results?.matches)
            ? response.data.results.matches
            : [];
        if (!Array.isArray(response.data?.results?.matches)) {
            logger.warn('[TinEye Service] matches is not array:', response.data?.results?.matches);
        }
        const results = matches.map(match => ({
            url: match.image_url,
            type: 'Match',
            source: 'TinEye',
            backlinks: Array.isArray(match.backlinks)
                ? match.backlinks.map(link => link.url)
                : []
        }));

        logger.info(`[TinEye Service] Search complete. Found ${results.length} matches.`);
        return { success: true, matches: results, error: null };

    } catch (error) {
        if (error.response) {
            logger.error(`[TinEye Service] API Error Status: ${error.response.status}`);
            logger.error('[TinEye Service] API Error Data:', error.response.data || '(empty)');
            // logger.error('[TinEye Service] API Error Headers:', error.response.headers); // Headers 通常太長，可以先註解
            const errorMessage = JSON.stringify(error.response.data) || `HTTP ${error.response.status}`;
            return { success: false, matches: [], error: errorMessage };
        } else if (error.request) {
            logger.error('[TinEye Service] No response received from API server.', error.request);
            return { success: false, matches: [], error: 'No response from TinEye API.' };
        } else {
            logger.error('[TinEye Service] Axios request setup error:', error.message);
            return { success: false, matches: [], error: error.message };
        }
    }
}

module.exports = {
    searchByBuffer,
};
