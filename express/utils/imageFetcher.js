// express/utils/imageFetcher.js
const axios = require('axios');
const logger = require('./logger');

/**
 * 從給定的 URL 下載圖片並回傳其 Buffer。
 * @param {string} imageUrl - 要下載的圖片 URL。
 * @returns {Promise<Buffer|null>} 成功則回傳圖片的 Buffer，失敗則回傳 null。
 */
async function fetchImageAsBuffer(imageUrl) {
  try {
    logger.info(`[ImageFetcher] Fetching image from URL: ${imageUrl}`);
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer', // 關鍵：確保回傳的是二進制數據
    });

    if (response.status !== 200) {
      logger.error(`[ImageFetcher] Failed to fetch image. Status: ${response.status}, URL: ${imageUrl}`);
      return null;
    }

    // 將回傳的數據轉換為 Buffer
    const imageBuffer = Buffer.from(response.data, 'binary');
    logger.info(`[ImageFetcher] Successfully fetched image. Buffer size: ${imageBuffer.length} bytes.`);
    return imageBuffer;

  } catch (error) {
    logger.error(`[ImageFetcher] Error fetching image from ${imageUrl}:`, error);
    return null;
  }
}

module.exports = {
  fetchImageAsBuffer,
};
