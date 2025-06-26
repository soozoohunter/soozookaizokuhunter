// express/utils/vectorSearch.js (Final Unified API Version)
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');

const VECTOR_SERVICE_URL = process.env.VECTOR_SERVICE_URL;
const INDEX_ENDPOINT = `${VECTOR_SERVICE_URL}/index-image`;
const SEARCH_ENDPOINT = `${VECTOR_SERVICE_URL}/search-image`;

/**
 * 【修正】發送圖片 Buffer 到 Python 服務進行索引。
 * @param {Buffer} imageBuffer - 圖片的檔案緩衝區。
 * @param {string} fileId - 檔案在資料庫中的 ID。
 * @returns {Promise<object|null>}
 */
async function indexImageVector(imageBuffer, fileId) {
    if (!Buffer.isBuffer(imageBuffer)) {
        logger.error(`[VectorSearch] Indexing failed: Input for file ID ${fileId} is not a buffer.`);
        return null;
    }
    
    logger.info(`[VectorSearch] Indexing image buffer for ID: ${fileId}`);
    const form = new FormData();
    form.append('image', imageBuffer, { filename: `image-${fileId}.jpg` }); // 提供一個檔名
    form.append('id', fileId.toString());

    try {
        const response = await axios.post(INDEX_ENDPOINT, form, {
            headers: form.getHeaders(),
            timeout: 60000
        });
        logger.info(`[VectorSearch] Successfully indexed ID ${fileId}.`);
        return response.data;
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        logger.error(`[VectorSearch] Error indexing image ID ${fileId}:`, errorMsg);
        return null;
    }
}

/**
 * 上傳圖片到 Python 服務以搜尋相似的圖片。
 * @param {Buffer|string} input - 圖片的 Buffer 或本地檔案路徑。
 * @param {object} options - 包含 topK 等選項的物件。
 * @returns {Promise<Array>}
 */
async function searchImageByVector(input, options = {}) {
    const { topK = 10 } = options;
    let tempPath = null;
    let imageStream;

    try {
        if (Buffer.isBuffer(input)) {
            imageStream = input; //可以直接傳遞Buffer給form-data
            logger.info(`[VectorSearch] Searching similar images via buffer.`);
        } else if (typeof input === 'string' && fs.existsSync(input)) {
            imageStream = fs.createReadStream(input);
            logger.info(`[VectorSearch] Searching for similar images via file path: ${input}`);
        } else {
            logger.warn('[VectorSearch] Invalid input provided for search.');
            return [];
        }
        
        const form = new FormData();
        form.append('image', imageStream, { filename: 'search-image.jpg'});
        form.append('top_k', topK.toString());

        const response = await axios.post(SEARCH_ENDPOINT, form, {
            headers: form.getHeaders(),
            timeout: 60000
        });

        const results = response.data?.results || [];
        logger.info(`[VectorSearch] Search successful. Found ${results.length} matches.`);
        return results;

    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        logger.error(`[VectorSearch] Error searching for similar images:`, errorMsg);
        return [];
    }
}

module.exports = {
    indexImageVector,
    searchImageByVector
};
