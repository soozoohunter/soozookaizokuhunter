// express/services/fingerprintService.js (Final Merged Version)
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * 【新增並修正的函式】
 * 計算指定檔案的 SHA-256 雜湊值 (指紋)。
 * 此函式名為 getHash 並接受一個檔案路徑作為輸入，以直接解決 protect.js 的錯誤。
 * @param {string} filePath - 檔案的本地路徑。
 * @returns {Promise<string>} - 一個 Promise，成功時會回傳十六進位格式的 SHA-256 雜湊值。
 */
function getHash(filePath) {
  return new Promise((resolve, reject) => {
    logger.debug(`[Fingerprint] Calculating SHA256 for file: ${filePath}`);
    
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', data => hash.update(data));
    stream.on('end', () => {
      const hexHash = hash.digest('hex');
      logger.info(`[Fingerprint] Calculated hash for ${filePath}: ${hexHash.substring(0, 12)}...`);
      resolve(hexHash);
    });
    stream.on('error', err => {
      logger.error(`[Fingerprint] Error reading file for hashing: ${filePath}`, err);
      reject(err);
    });
  });
}

/**
 * 【保留您原有的函式】
 * 將檔案 buffer 傳送到 FastAPI 進行更多檢查。
 * @param {Buffer} buffer - 檔案的緩衝區。
 * @returns {Promise<object>} - FastAPI 的回傳結果。
 */
async function checkImageViaFastAPI(buffer) {
  try {
    const fastapiUrl = process.env.FASTAPI_URL || 'http://suzoo_fastapi:8000';
    logger.info(`[Fingerprint] Forwarding buffer to FastAPI at ${fastapiUrl}/fingerprint`);
    const resp = await axios.post(`${fastapiUrl}/fingerprint`, buffer, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
    return resp.data;
  } catch (error) {
    logger.error('[Fingerprint] Failed to check image via FastAPI:', error);
    throw error;
  }
}

// 【關鍵】導出名為 getHash 的函式，並同時保留您原有的函式。
module.exports = {
  getHash, // 修正後的函式，供 protect.js 使用
  checkImageViaFastAPI, // 保留您原有的函式
};
