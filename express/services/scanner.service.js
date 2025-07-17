const visionService = require('./vision.service');
const tineyeService = require('./tineye.service');
const bingService = require('./bing.service');
const { searchPlatform } = require('./rapidApi.service');
const { verifyMatches } = require('../utils/imageFetcher');
const logger = require('../utils/logger');

// [新增] 處理 Bing API 錯誤
async function searchWithBing(imageBuffer, maxResults) {
    try {
        const res = await bingService.searchByBuffer(imageBuffer);
        return res.links?.slice(0, maxResults) || [];
    } catch (error) {
        logger.error(`[Bing Service] 搜尋失敗: ${error.message}`);
        if (error.response?.status === 401) {
            logger.warn('[Bing Service] API金鑰無效，使用Google Vision替代');
            const gv = await visionService.searchByBuffer(imageBuffer);
            return gv.links?.slice(0, maxResults) || [];
        }
        return [];
    }
}

// [新增] 增強錯誤處理的全面掃描
async function fullScan(imageBuffer, keywords) {
    try {
        const results = { platforms: [], sources: [] };

        const [bingResults, googleResults, tineyeResults, socialResults] = await Promise.all([
            searchWithBing(imageBuffer, 10),
            visionService.searchByBuffer(imageBuffer).then(r => r.links || []),
            tineyeService.searchByBuffer(imageBuffer).then(r => r.matches?.map(m => m.url) || []),
            searchPlatform('youtube', keywords).catch(() => [])
        ]);

        if (bingResults.length > 0) {
            results.platforms.push({ name: 'Bing 圖片搜尋', results: bingResults });
            results.sources.push('bing');
        }
        if (googleResults.length > 0) {
            results.platforms.push({ name: 'Google Vision', results: googleResults });
            results.sources.push('google');
        }
        if (tineyeResults.length > 0) {
            results.platforms.push({ name: 'TinEye 反向搜尋', results: tineyeResults });
            results.sources.push('tineye');
        }
        if (socialResults.length > 0) {
            results.platforms.push({ name: '社群媒體', results: socialResults });
            results.sources.push('social');
        }

        return results;
    } catch (error) {
        logger.error(`[Scanner Service] 全面掃描失敗: ${error.message}`);
        throw new Error('掃描過程中發生錯誤');
    }
}

const scanByImage = async (imageBuffer, options = {}) => {
    logger.info('[Scanner Service] Received scan request with options:', options);
    const results = {};
    const errors = [];
    const { keywords, fingerprint } = options;

    const reverseImageSearchPromises = [
        visionService.searchByBuffer(imageBuffer).then(res => ({ source: 'vision', data: res })),
        tineyeService.searchByBuffer(imageBuffer).then(res => ({ source: 'tineye', data: res })),
        bingService.searchByBuffer(imageBuffer).then(res => ({ source: 'bing', data: res }))
    ];

    const searchResults = await Promise.allSettled(reverseImageSearchPromises);

    searchResults.forEach(result => {
        if (result.status === 'fulfilled') {
            const { source, data } = result.value;
            if (data.success) {
                if (source === 'tineye') {
                    results[source] = data.matches?.map(m => m.url) || [];
                } else {
                    results[source] = data.links || [];
                }
            } else {
                errors.push({ source, reason: data.error || 'API returned failure.' });
            }
        } else {
            errors.push({ source: 'unknown', reason: result.reason?.message || 'A search promise was rejected.' });
        }
    });

    if (keywords && keywords.trim() !== '') {
        logger.info(`[Scanner Service] Performing keyword searches for: "${keywords}"`);
        const keywordSearchPlatforms = ['youtube', 'globalImage', 'tiktok', 'instagram', 'facebook'];
        const keywordSearchPromises = keywordSearchPlatforms.map(platform => 
            searchPlatform(platform, keywords)
                .then(links => ({ source: platform, links }))
                .catch(err => ({ source: platform, error: err }))
        );

        const keywordResults = await Promise.all(keywordSearchPromises);

        keywordResults.forEach(result => {
            if (result.error) {
                errors.push({ source: result.source, reason: result.error.message });
            } else if (result.links && result.links.length > 0) {
                results[result.source] = result.links;
            }
        });
    }

    logger.info(`[Scanner Service] Full scan completed. Found results from ${Object.keys(results).length} sources.`);
    if (errors.length > 0) {
        logger.warn('[Scanner Service] Some APIs failed during scan:', errors);
    }

    const allLinks = Object.values(results).flat();
    const uniqueLinks = [...new Set(allLinks)];
    let verification = { matches: [], errors: [] };
    if (uniqueLinks.length > 0) {
        try {
            verification = await verifyMatches(imageBuffer, uniqueLinks, fingerprint);
        } catch (err) {
            logger.error('[Scanner Service] Verification step failed:', err);
            errors.push({ source: 'verify', reason: err.message });
        }
    }

    return {
        results,
        errors,
        verification,
    };
};

module.exports = {
    scanByImage,
    searchWithBing,
    fullScan,
};
