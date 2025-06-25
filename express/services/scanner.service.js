const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const logger = require('../utils/logger');
const tinEyeService = require('./tineye.service');
const visionService = require('./vision.service');
const rapidApiService = require('./rapidApi.service');

async function performFullScan({ buffer, keyword }) {
    if (!buffer) throw new Error('Image buffer is required for a full scan.');

    logger.info('[Scanner Service] Starting full infringement scan...');
    const overallStart = Date.now();

    const tmpDir = os.tmpdir();
    const tmpFileName = `scan_tmp_${Date.now()}.jpg`;
    const tmpPath = path.join(tmpDir, tmpFileName);

    let allResults = {};

    try {
        await fs.writeFile(tmpPath, buffer);
        logger.info(`[Scanner Service] Temp file created for scan: ${tmpPath}`);

        const [tineyeResult, visionResult, rapidResults] = await Promise.all([
            tinEyeService.searchByFile(tmpPath),
            visionService.searchByBuffer(buffer),
            (async () => {
                if (!keyword) {
                    logger.warn('[Scanner Service] No keyword, skipping RapidAPI searches.');
                    return {};
                }
                const [tiktok, youtube, instagram, facebook] = await Promise.all([
                    rapidApiService.tiktokSearch(keyword),
                    rapidApiService.youtubeSearch(keyword),
                    rapidApiService.instagramSearch(keyword),
                    rapidApiService.facebookSearch(keyword),
                ]);
                return { tiktok, youtube, instagram, facebook };
            })()
        ]);

        allResults = {
            tineye: tineyeResult,
            vision: visionResult,
            rapid: rapidResults,
        };

    } catch (err) {
        logger.error(`[Scanner Service] A critical error occurred during the scan orchestration: ${err.message}`);
        throw err;
    } finally {
        try {
            await fs.unlink(tmpPath);
            logger.info(`[Scanner Service] Deleted temp file: ${tmpPath}`);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                logger.error(`[Scanner Service] Failed to delete temp file: ${e.message}`);
            }
        }
    }

    logger.info(`[Scanner Service] Full scan finished in ${Date.now() - overallStart}ms.`);
    return allResults;
}

module.exports = {
    performFullScan,
};
