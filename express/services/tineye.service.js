// express/services/tineye.service.js
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

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

    logger.info('[TinEye Service] Starting search by image buffer...');
    const form = new FormData();
    form.append('image', buffer, { filename: 'search.jpg' });

    try {
        const response = await axios.post(TINEYE_API_URL, form, {
            headers: {
                ...form.getHeaders(),
                'X-Api-Key': TINEYE_API_KEY,
            },
        });

        const results = response.data.results.matches.map(match => ({
            url: match.image_url,
            type: 'Match',
            source: 'TinEye',
            backlinks: match.backlinks.map(link => link.url)
        }));

        logger.info(`[TinEye Service] Search complete. Found ${results.length} matches.`);
        return { success: true, matches: results, error: null };

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error('[TinEye Service] Search failed:', errorMessage);
        return { success: false, matches: [], error: errorMessage };
    }
}

module.exports = {
    searchByBuffer,
};
