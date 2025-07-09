/**
 * express/utils/extractFrames.js (優化版)
 * - 從影片檔案中抽取多個關鍵畫格的輔助工具
 *
 * 【本次優化】:
 * - [健壯性] 增加對影片時長為 0 或無法獲取的檢查，避免後續的除零錯誤。
 * - [健壯性] 將時間戳轉換為 FFmpeg 更偏好的 HH:MM:SS.mmm 格式，提高精確度。
 * - [日誌增強] 在錯誤捕獲中增加了更詳細的日誌輸出，便於追蹤問題。
 * - [可讀性] 增加了 JSDoc 註解，提高程式碼可讀性。
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE_DIR = path.resolve(__dirname, '..', 'uploads');

/**
 * 將總秒數格式化為 HH:MM:SS.mmm 格式
 * @param {number} totalSeconds - 總秒數
 * @returns {string} HH:MM:SS.mmm 格式的時間字串
 */
function formatTimestamp(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

    const pad = (num) => num.toString().padStart(2, '0');
    const padMs = (num) => num.toString().padStart(3, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${padMs(milliseconds)}`;
}

/**
 * 使用 ffprobe 獲取影片的總時長（秒）
 * @param {string} videoPath - 影片檔案的絕對路徑
 * @returns {Promise<number>} 影片時長（秒），失敗則返回 0
 */
function getVideoDuration(videoPath) {
    try {
        // 使用 ffprobe 命令獲取影片時長，-sexagesimal 選項可以處理不同格式的時間輸出
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
        const stdout = execSync(command).toString().trim();
        const duration = parseFloat(stdout);
        
        if (isNaN(duration) || duration <= 0) {
            console.warn(`[ffprobe] Could not determine a valid duration for ${videoPath}. Raw output: "${stdout}"`);
            return 0;
        }
        return duration;
    } catch (error) {
        console.error(`[ffprobe] Fatal error getting duration for ${videoPath}. Command failed.`, error.stderr ? error.stderr.toString() : error);
        return 0;
    }
}

/**
 * 從影片中抽取指定數量的關鍵畫格
 * @param {string} videoPath - 影片檔案的絕對路徑
 * @param {number} [frameCount=3] - 要抽取的畫格數量
 * @returns {Promise<string[]>} 一個包含所有暫存畫格圖片路徑的陣列
 */
async function extractKeyFrames(videoPath, frameCount = 3) {
    const duration = getVideoDuration(videoPath);
    if (duration <= 1) { // 如果影片長度小於等於1秒，很難均勻取幀
        console.warn(`[extractKeyFrames] Video duration is too short (${duration}s). Skipping frame extraction.`);
        return [];
    }

    const framePaths = [];
    const tempDir = path.join(UPLOAD_BASE_DIR, 'temp_frames');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // 計算每個畫格的抽取時間點（例如，對於3個畫格，在 25%, 50%, 75% 處抽取）
    const interval = duration / (frameCount + 1);

    for (let i = 1; i <= frameCount; i++) {
        const timestampInSeconds = interval * i;
        // 使用更精確的時間戳格式
        const timestampFormatted = formatTimestamp(timestampInSeconds);
        const outputFramePath = path.join(tempDir, `frame_${path.basename(videoPath)}_${i}_${Date.now()}.jpg`);
        
        try {
            // -ss: 定位到時間點
            // -vframes 1: 只抽取一個畫格
            // -q:v 2: 輸出高品質的 JPG 圖片
            const command = `ffmpeg -y -ss ${timestampFormatted} -i "${videoPath}" -vframes 1 -q:v 2 "${outputFramePath}"`;
            execSync(command, { stdio: 'pipe' }); // 使用 'pipe' 避免在 console 中輸出大量 ffmpeg log

            if (fs.existsSync(outputFramePath) && fs.statSync(outputFramePath).size > 0) {
                framePaths.push(outputFramePath);
                console.log(`[extractKeyFrames] Successfully extracted frame at ${timestampInSeconds.toFixed(2)}s to ${outputFramePath}`);
            } else {
                 console.warn(`[extractKeyFrames] ffmpeg command ran but failed to create a valid file for ${outputFramePath}`);
            }
        } catch (error) {
            console.error(`[ffmpeg] Error extracting frame for ${videoPath} at ${timestampFormatted}.`, error.stderr ? error.stderr.toString() : error);
        }
    }

    return framePaths;
}

module.exports = {
    extractKeyFrames,
    getVideoDuration
};
