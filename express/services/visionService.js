// === express/services/visionService.js (完整重構與優化版) ===
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const tinEyeApi = require('./tineyeApiService');
const rapidApiService = require('./rapidApiService');

// --- [診斷程式碼開始] ---
console.log("==============================================");
console.log("DIAGNOSTIC LOG: Checking Environment Variable...");
console.log(`Value of GOOGLE_APPLICATION_CREDENTIALS is: "${process.env.GOOGLE_APPLICATION_CREDENTIALS}"`);
console.log("==============================================");
// --- [診斷程式碼結束] ---

const visionClient = new ImageAnnotatorClient();
console.log('[Service] Google Vision Client initialized.');

const VISION_MAX_RESULTS = parseInt(process.env.VISION_MAX_RESULTS, 10) || 50;

async function infringementScan({ buffer, keyword }) {
    if (!buffer) throw new Error('Buffer is required for infringement scan');
    if (!keyword) console.warn('[Service] Keyword not provided; RapidAPI searches will be skipped.');

    console.log('[Service] Starting infringement scan...');
    const overallStart = Date.now();

    const tmpDir = os.tmpdir();
    const tmpFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
    const tmpPath = path.join(tmpDir, tmpFileName);
    let tmpFileCreated = false;

    // --- TinEye Scan ---
    let tineyeResult = { success: false, links: [], error: 'Skipped' };
    try {
        await fs.writeFile(tmpPath, buffer);
        console.log(`[Service] Temp file created for TinEye scan: ${tmpPath}`);
        tmpFileCreated = true;

        console.log('[Service] Calling TinEye API...');
        const start = Date.now();
        const result = await tinEyeApi.searchByFile(tmpPath);
        tineyeResult = { success: true, links: result.links || [], error: null };
        console.log(`[Service] TinEye scan completed in ${Date.now() - start}ms, found ${tineyeResult.links.length} links.`);
    } catch (err) {
        console.error('[Service] TinEye API process failed:', err.message);
        tineyeResult = { success: false, links: [], error: err.message };
    }

    // --- Google Vision Scan ---
    let visionResult = { success: false, links: [], error: null };
    try {
        console.log('[Service] Calling Google Vision API...');
        const start = Date.now();
        const [result] = await visionClient.webDetection({ image: { content: buffer } });
        const webDetection = result.webDetection;
        let urls = [];
        if (webDetection && webDetection.pagesWithMatchingImages) {
            urls = webDetection.pagesWithMatchingImages.map(page => page.url).filter(Boolean);
        }
        visionResult = { success: true, links: [...new Set(urls)].slice(0, VISION_MAX_RESULTS), error: null };
        console.log(`[Service] Google Vision scan completed in ${Date.now() - start}ms, found ${urls.length} links.`);
    } catch (err) {
        console.error('[Service] Google Vision API call failed:', err.message);
        if (err.code === 16) {
            console.error('[Service] FATAL: Google Vision Authentication failed! Verify key file, IAM role, and that the GOOGLE_APPLICATION_CREDENTIALS environment variable is correctly set inside the container.');
        }
        visionResult = { success: false, links: [], error: err.message };
    }

    // --- RapidAPI Integrations ---
    // 【優化】: 由於 rapidApiService 內部已處理錯誤，這裡的程式碼大幅簡化。
    // 我們並行執行所有搜尋，並收集它們的 { success, links, error } 結果。
    const rapidResults = {};
    if (process.env.RAPIDAPI_KEY && keyword) {
        console.log(`[Service] Calling RapidAPI integrations with keyword: "${keyword}"`);
        // 使用 Promise.allSettled 可以確保即使某個 promise 被 reject (雖然我們已經避免了)，其他 promise 也能完成
        const results = await Promise.allSettled([
            rapidApiService.tiktokSearch(keyword),
            rapidApiService.instagramSearch(keyword),
            rapidApiService.facebookSearch(keyword),
            rapidApiService.youtubeSearch(keyword)
        ]);
        
        rapidResults.tiktok = results[0].status === 'fulfilled' ? results[0].value : { success: false, links: [], error: 'Promise rejected' };
        rapidResults.instagram = results[1].status === 'fulfilled' ? results[1].value : { success: false, links: [], error: 'Promise rejected' };
        rapidResults.facebook = results[2].status === 'fulfilled' ? results[2].value : { success: false, links: [], error: 'Promise rejected' };
        rapidResults.youtube = results[3].status === 'fulfilled' ? results[3].value : { success: false, links: [], error: 'Promise rejected' };
        
    } else {
        const reason = !process.env.RAPIDAPI_KEY ? "RAPIDAPI_KEY is not set" : "Keyword was not provided";
        console.warn(`[Service] Skipping RapidAPI integrations. Reason: ${reason}.`);
    }

    // --- Cleanup ---
    if (tmpFileCreated) {
        try {
            await fs.unlink(tmpPath);
            console.log(`[Service] Deleted temp file: ${tmpPath}`);
        } catch (e) {
            console.error(`[Service] Failed to delete temp file: ${e.message}`);
        }
    }

    console.log(`[Service] Overall scan finished in ${Date.now() - overallStart}ms.`);

    // 【優化】: 回傳的物件結構更清晰，包含了每個服務的成功狀態和結果。
    return {
        tineye: tineyeResult,
        vision: visionResult,
        rapid: rapidResults,
    };
}

async function searchVisionByBuffer(buffer) {
    const { vision } = await infringementScan({ buffer, keyword: null });
    return vision.links;
}

module.exports = {
    infringementScan,
    searchVisionByBuffer,
};
