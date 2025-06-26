// express/utils/vectorSearch.js (Final Unified API Version)
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');

// --- Python 向量服務端點 ---
const VECTOR_SERVICE_URL = process.env.VECTOR_SERVICE_URL;
const INDEX_ENDPOINT = `${VECTOR_SERVICE_URL}/index-image`;
const SEARCH_ENDPOINT = `${VECTOR_SERVICE_URL}/search-image`;

/**
 * 發送圖片到 Python 服務進行向量化並索引。
 * @param {string} localImagePath - 圖片在本地的檔案路徑。
 * @param {string} fileId - 檔案在資料庫中的 ID，用於建立關聯。
 * @returns {Promise<object|null>} - 成功時返回 API 回應，失敗時返回 null。
 */
async function indexImageVector(localImagePath, fileId) {
    if (!fs.existsSync(localImagePath)) {
        logger.error(`[VectorSearch] Indexing failed: File not found at ${localImagePath}`);
        return null;
    }
    
    logger.info(`[VectorSearch] Indexing image: ${localImagePath} with ID: ${fileId}`);
    const form = new FormData();
    // 確保 form-data 的 key 與 Python FastAPI 端點的參數名一致 ('image', 'id')
    form.append('image', fs.createReadStream(localImagePath));
    form.append('id', fileId.toString());

    try {
        const response = await axios.post(INDEX_ENDPOINT, form, {
            headers: form.getHeaders(),
            timeout: 60000 // 60秒超時，以應對大檔案和模型處理
        });
        logger.info(`[VectorSearch] Successfully indexed ID ${fileId}. Response: ${JSON.stringify(response.data)}`);
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
 * @returns {Promise<Array>} - 成功時返回相似結果的陣列，失敗時返回空陣列。
 */
async function searchImageByVector(input, options = {}) {
    const { topK = 10 } = options;
    let tempPath = null;
    let imageStream;

    try {
        // --- 統一輸入來源為 Stream ---
        if (Buffer.isBuffer(input)) {
            // 如果輸入是 Buffer，創建臨時檔案以便生成讀取流
            tempPath = path.join(os.tmpdir(), `vector_search_tmp_${Date.now()}.jpg`);
            await fs.promises.writeFile(tempPath, input);
            imageStream = fs.createReadStream(tempPath);
            logger.info(`[VectorSearch] Searching for similar images via buffer (temp file: ${tempPath})`);
        } else if (typeof input === 'string' && fs.existsSync(input)) {
            // 如果輸入是有效的檔案路徑
            imageStream = fs.createReadStream(input);
            logger.info(`[VectorSearch] Searching for similar images via file path: ${input}`);
        } else {
            logger.warn('[VectorSearch] Invalid input for search. Must be a Buffer or a valid file path.');
            return []; // 返回空陣列
        }
        
        const form = new FormData();
        // 確保 key 與 Python FastAPI 端點參數名一致 ('image', 'top_k')
        form.append('image', imageStream);
        form.append('top_k', topK.toString());

        const response = await axios.post(SEARCH_ENDPOINT, form, {
            headers: form.getHeaders(),
            timeout: 60000 // 60秒超時
        });

        const results = response.data?.results || [];
        logger.info(`[VectorSearch] Search successful. Found ${results.length} matches.`);
        return results; // 直接回傳結果陣列

    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data) : e.message;
        logger.error(`[VectorSearch] Error searching for similar images:`, errorMsg);
        return []; // 發生錯誤時返回空陣列
    } finally {
        // --- 清理臨時檔案 ---
        if (tempPath) {
            fs.unlink(tempPath, (err) => {
                if (err) logger.warn(`[VectorSearch] Failed to delete temp file: ${tempPath}`, err);
            });
        }
    }
}

module.exports = {
    indexImageVector,
    searchImageByVector
};
