// express/services/scanner.service.js (Robust Version)
const logger = require('../utils/logger');
const tinEyeService = require('./tineye.service');
const visionService = require('./vision.service');
const rapidApiService = require('./rapidApi.service');

/**
 * 執行完整的侵權掃描，作為一個協同運作層。
 */
async function performFullScan(options) {
    // 【新增】詳細記錄收到的參數，以便除錯
    logger.info('[Scanner Service] Received scan request with options:', {
        hasBuffer: !!options.buffer,
        bufferLength: options.buffer ? options.buffer.length : 'N/A',
        keyword: options.keyword
    });

    const { buffer, keyword } = options; // 從 options 物件中解構出 buffer 和 keyword

    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error('A valid image buffer is required for a full scan.');
    }
    if (!keyword) {
        logger.warn('[Scanner Service] No keyword provided, skipping keyword-based searches.');
    }

    const startTime = Date.now();

    const scanPromises = [
        visionService.infringementScan(buffer),
        tinEyeService.searchByBuffer(buffer),
        keyword ? rapidApiService.tiktokSearch(keyword) : Promise.resolve({ success: true, links: [] }),
        keyword ? rapidApiService.youtubeSearch(keyword) : Promise.resolve({ success: true, links: [] }),
        keyword ? rapidApiService.instagramSearch(keyword) : Promise.resolve({ success: true, links: [] }),
        keyword ? rapidApiService.facebookSearch(keyword) : Promise.resolve({ success: true, links: [] })
    ];

    const results = await Promise.allSettled(scanPromises);
    
    const [
        visionResult,
        tinEyeResult,
        tiktokResult,
        youtubeResult,
        instagramResult,
        facebookResult
    ] = results.map(res => {
        if (res.status === 'fulfilled') {
            return { success: true, ...res.value };
        } else {
            logger.error('[Scanner Service] A sub-scan failed:', res.reason);
            return { success: false, links: [], matches: [], error: res.reason?.message || '未知錯誤' };
        }
    });

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
