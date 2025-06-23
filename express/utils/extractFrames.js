**
 * express/utils/extractFrames.js (優化版)
 *
 * 【本次優化】:
 * - [健壯性] 增加對 ffprobe 失敗的錯誤處理，並提供更清晰的日誌。
 * - [健壯性] 在執行 ffmpeg 前，檢查 timemarks 陣列是否為空，避免不必要的執行。
 * - [日誌] 增加更詳細的日誌輸出，便於追蹤影片處理過程。
 * - [可讀性] 增加程式碼註解，解釋各個參數的作用。
 */
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// 確保 ffmpeg 執行檔路徑已設定
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * 從影片中依固定間隔抽取多個關鍵畫面。
 * @param {string} videoPath 來源影片的絕對路徑。
 * @param {string} outputDir 輸出畫面的資料夾路徑。
 * @param {number} intervalSec 抽圖的時間間隔（秒）。預設為 10 秒。
 * @param {number} maxCount 最多抽取的畫面數量。預設為 5 張。
 * @returns {Promise<string[]>} 一個 Promise，解析後回傳所有成功產生的畫面檔案絕對路徑陣列。
 */
function extractKeyFrames(videoPath, outputDir, intervalSec = 10, maxCount = 5) {
    return new Promise((resolve, reject) => {
        console.log(`[extractKeyFrames] Starting frame extraction for: ${videoPath}`);

        if (!fs.existsSync(videoPath)) {
            const errorMsg = `Video file not found at path: ${videoPath}`;
            console.error(`[extractKeyFrames] Error: ${errorMsg}`);
            return reject(new Error(errorMsg));
        }

        if (!fs.existsSync(outputDir)) {
            console.log(`[extractKeyFrames] Creating output directory: ${outputDir}`);
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 1. 使用 ffprobe 讀取影片元數據 (metadata)
        ffmpeg.ffprobe(videoPath, (err, data) => {
            if (err) {
                const errorMsg = `Cannot probe video info. It might be corrupted or in an unsupported format. Error: ${err.message}`;
                console.error(`[extractKeyFrames] ffprobe Error for ${videoPath}:`, err);
                return reject(new Error(errorMsg));
            }

            const duration = data.format.duration || 0;
            if (duration === 0) {
                console.warn(`[extractKeyFrames] Video duration is 0 for ${videoPath}. Cannot extract frames.`);
                return resolve([]); // 回傳空陣列，不視為錯誤
            }

            // 2. 根據影片長度和設定，計算要擷取的時間點 (timemarks)
            const totalSpan = intervalSec * maxCount;
            const actualSpan = Math.min(duration, totalSpan);
            const effectiveCount = Math.floor(actualSpan / intervalSec) + 1;

            let timemarks = [];
            for (let i = 0; i < Math.min(maxCount, effectiveCount); i++) {
                timemarks.push(String(i * intervalSec));
            }
            // 確保影片結尾也被考慮
            if (duration > 0 && !timemarks.includes(String(duration)) && timemarks.length < maxCount) {
                 // 可以在此加入最後一幀的邏輯，但為求間隔一致，暫時省略
            }


            console.log(`[extractKeyFrames] Video duration: ${duration}s. Generating ${timemarks.length} frames at intervals of ${intervalSec}s. Timestamps:`, timemarks);

            if (timemarks.length === 0) {
                console.warn('[extractKeyFrames] No timemarks generated, skipping ffmpeg execution.');
                return resolve([]);
            }

            let generatedFiles = [];
            
            // 3. 執行 ffmpeg 進行截圖
            ffmpeg(videoPath)
                .on('error', (ffmpegErr) => {
                    const errorMsg = `FFmpeg process failed during screenshotting. Error: ${ffmpegErr.message}`;
                    console.error('[extractKeyFrames] FFmpeg Error:', ffmpegErr);
                    reject(new Error(errorMsg));
                })
                .on('end', () => {
                    console.log(`[extractKeyFrames] Successfully extracted ${generatedFiles.length} frames.`);
                    resolve(generatedFiles);
                })
                .on('filenames', (filenames) => {
                    // 將相對路徑轉為絕對路徑
                    generatedFiles = filenames.map(name => path.join(outputDir, name));
                    console.log('[extractKeyFrames] Generated filenames:', generatedFiles);
                })
                .screenshots({
                    timemarks: timemarks,
                    folder: outputDir,
                    filename: 'frame-%s-%i.png', // %s = timestamp, %i = index
                    size: '800x?' // 限制寬度以加快處理速度
                });
        });
    });
}

module.exports = { extractKeyFrames };
