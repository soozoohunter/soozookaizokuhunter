// express/utils/imageFetcher.js
const axios = require('axios');
const fingerprintService = require('../services/fingerprintService');
const logger = require('./logger');

const TIMEOUT = 15000; // 15 秒超時

/**
 * 下載單一圖片並回傳其 buffer
 * @param {string} url - 圖片 URL
 * @returns {Promise<Buffer|null>}
 */
const downloadImage = async (url) => {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            }
        });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        logger.warn(`[ImageFetcher] Failed to download image from ${url}. Reason: ${error.message}`);
        return null;
    }
};

/**
 * 驗證找到的圖片是否與原圖匹配
 * @param {Buffer} originalImageBuffer - 原圖的 Buffer
 * @param {string[]} urlsToVerify - 待驗證的圖片 URL 列表
 * @param {string} originalFingerprint - 原圖的 SHA256 指紋
 * @returns {Promise<object>}
 */
const verifyMatches = async (originalImageBuffer, urlsToVerify, originalFingerprint) => {
    const matches = [];
    const errors = [];
    
    if (!originalFingerprint) {
        originalFingerprint = fingerprintService.sha256(originalImageBuffer);
    }
    
    const verificationPromises = urlsToVerify.map(async (url) => {
        const downloadedBuffer = await downloadImage(url);
        if (downloadedBuffer) {
            const downloadedFingerprint = fingerprintService.sha256(downloadedBuffer);
            if (downloadedFingerprint === originalFingerprint) {
                return { url, status: 'matched' };
            }
        }
        return { url, status: 'unmatched' };
    });

    const results = await Promise.allSettled(verificationPromises);
    
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.status === 'matched') {
            matches.push({
                url: result.value.url,
                similarity: '100%',
                source: 'Verified Match'
            });
        } else if (result.status === 'rejected') {
            errors.push({ url: 'unknown', reason: result.reason.message });
        }
    });

    return { matches, errors };
};

module.exports = {
    verifyMatches,
};
