// express/services/scanner.service.js (New Logic for Reverse Image Search)
const logger = require('../utils/logger');
const visionService = require('./vision.service');
const tinEyeService = require('./tineye.service');
const imageFetcher = require('./imageFetcher');
const fingerprintService = require('./fingerprintService');
const axios = require('axios');

// 輔助函式：用於延遲，避免短時間內發送過多請求
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 執行完整的侵權掃描，核心是反向圖片搜尋和結果驗證。
 * @param {object} options
 * @param {Buffer} options.buffer - 原始圖片的緩衝區。
 * @param {string} options.originalFingerprint - 原始圖片的 SHA256 指紋。
 * @param {string} [options.keyword] - (可選) 用於輔助搜尋的關鍵字。
 */
async function performFullScan(options) {
    const startTime = Date.now();
    logger.info('[Scanner Service] Received scan request with new logic.');

    const { buffer, originalFingerprint } = options;

    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error('A valid image buffer is required for a full scan.');
    }
    if (!originalFingerprint) {
        throw new Error('Original image fingerprint is required for comparison.');
    }

    // 1. 核心搜尋：使用 Google Vision 和 TinEye 進行反向圖片搜尋
    logger.info('[Scanner Service] Step 1: Performing reverse image search with Google Vision and TinEye...');
    const [visionResult, tineyeResult] = await Promise.all([
        visionService.searchByBuffer(buffer),
        tinEyeService.searchByBuffer(buffer)
    ]);

    // 合併來自兩個來源的 URL，並確保唯一性
    const visionLinks = visionResult.success ? visionResult.links : [];
    const tineyeLinks = tineyeResult.success ? tineyeResult.matches.flatMap(m => m.backlinks.length > 0 ? m.backlinks : [m.url]) : [];

    const uniqueUrls = [...new Set([...visionLinks, ...tineyeLinks])];
    logger.info(`[Scanner Service] Found ${uniqueUrls.length} unique potential URLs.`);

    // 2. 驗證與深化：訪問 URL，下載圖片並比對指紋
    logger.info('[Scanner Service] Step 2: Verifying matches by fetching images and comparing fingerprints...');
    const verifiedMatches = [];
    for (const url of uniqueUrls.slice(0, 30)) { // 限制驗證數量以避免超時和成本
        try {
            const imageUrlOnPage = await imageFetcher.getMainImageUrl(url);
            if (!imageUrlOnPage) {
                logger.warn(`[Scanner Service] Could not extract image URL from page: ${url}`);
                continue;
            }

            const imageResponse = await axios.get(imageUrlOnPage, { responseType: 'arraybuffer' });
            const downloadedImageBuffer = Buffer.from(imageResponse.data);

            const downloadedImageFingerprint = fingerprintService.sha256(downloadedImageBuffer);

            if (downloadedImageFingerprint === originalFingerprint) {
                logger.info(`[Scanner Service] CONFIRMED MATCH! Fingerprint matches at: ${url}`);
                verifiedMatches.push({
                    pageUrl: url,
                    imageUrl: imageUrlOnPage,
                    source: 'Verified Match',
                    fingerprintMatch: true
                });
            }
            await delay(200);
        } catch (error) {
            logger.error(`[Scanner Service] Failed to verify URL ${url}: ${error.message}`);
        }
    }

    const aggregatedResults = {
        reverseImageSearch: {
            googleVision: visionResult,
            tineye: tineyeResult,
            potentialUrlsFound: uniqueUrls.length
        },
        verifiedMatches: verifiedMatches
    };

    const duration = Date.now() - startTime;
    logger.info(`[Scanner Service] Full scan completed in ${duration}ms. Found ${verifiedMatches.length} verified matches.`);
    return aggregatedResults;
}

module.exports = {
    performFullScan,
};
