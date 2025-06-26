// express/services/scanner.service.js (Final Orchestrator Version)
const logger = require('../utils/logger');
const tinEyeService = require('./tineye.service');
const visionService = require('./vision.service');
const rapidApiService = require('./rapidApi.service');

/**
 * 執行完整的侵權掃描，作為一個協同運作層，整合所有圖片及文字搜尋服務。
 * @param {Object} options
 * @param {Buffer} options.buffer - 用於圖片比對的檔案緩衝區。
 * @param {string} options.keyword - 用於文字搜尋的關鍵字。
 * @returns {Promise<Object>} - 包含所有平台掃描結果的彙總物件。
 */
async function performFullScan({ buffer, keyword }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error('Image buffer is required for a full scan.');
    }
    if (!keyword) {
        logger.warn('[Scanner Service] No keyword provided, skipping keyword-based searches.');
    }

    logger.info(`[Scanner Service] Starting full scan for keyword "${keyword}"...`);
    const startTime = Date.now();

    // 將所有需要執行的掃描任務放入 Promise 陣列
    const scanPromises = [
        // 以圖搜圖服務
        visionService.infringementScan(buffer),
        tinEyeService.searchByBuffer(buffer),
        // 關鍵字搜尋服務 (如果沒有關鍵字則不執行)
        keyword ? rapidApiService.tiktokSearch(keyword) : Promise.resolve({ success: true, links: [], platform: 'tiktok' }),
        keyword ? rapidApiService.youtubeSearch(keyword) : Promise.resolve({ success: true, links: [], platform: 'youtube' }),
        keyword ? rapidApiService.instagramSearch(keyword) : Promise.resolve({ success: true, links: [], platform: 'instagram' }),
        keyword ? rapidApiService.facebookSearch(keyword) : Promise.resolve({ success: true, links: [], platform: 'facebook' })
    ];

    // 使用 Promise.allSettled 來確保即使某個 API 失敗，其他結果也能成功返回
    const results = await Promise.allSettled(scanPromises);
    
    // --- 處理並標準化 allSettled 的結果 ---
    const [
        visionResult,
        tinEyeResult,
        tiktokResult,
        youtubeResult,
        instagramResult,
        facebookResult
    ] = results.map(res => {
        if (res.status === 'fulfilled') {
            // 對於成功的 promise，確認回傳的物件至少包含 success 和 links/matches
            return { success: true, ...res.value };
        } else {
            // 對於失敗的 promise，記錄錯誤並回傳一個標準的失敗物件
            logger.error('[Scanner Service] A sub-scan failed:', res.reason);
            return { success: false, links: [], matches: [], error: res.reason?.message || '未知錯誤' };
        }
    });

    // --- 彙總所有結果成一個結構清晰的物件 ---
    const aggregatedResults = {
        imageSearch: {
            googleVision: visionResult,
            tineye: tinEyeResult,
        },
        keywordSearch: {
            tiktok: tiktokResult,
            youtube: youtubeResult,
            instagram: instagramResult,
            facebook: facebookResult,
        }
    };
    
    const duration = Date.now() - startTime;
    logger.info(`[Scanner Service] Full scan completed in ${duration}ms`);
    return aggregatedResults;
}

module.exports = {
    performFullScan,
};
