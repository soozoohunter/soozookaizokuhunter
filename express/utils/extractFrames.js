/**
 * express/utils/extractFrames.js
 * - 從影片檔案中抽取多個關鍵畫格的輔助工具
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');

/**
 * 使用 ffprobe 獲取影片的總時長（秒）
 * @param {string} videoPath - 影片檔案的絕對路徑
 * @returns {number} 影片時長（秒），失敗則返回 0
 */
function getVideoDuration(videoPath) {
    try {
        // 使用 ffprobe 命令獲取影片時長
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
        const duration = parseFloat(execSync(command).toString().trim());
        return isNaN(duration) ? 0 : duration;
    } catch (error) {
        console.error(`[ffprobe] Error getting duration for ${videoPath}:`, error.stderr ? error.stderr.toString() : error);
        return 0;
    }
}

/**
 * 從影片中抽取指定數量的關鍵畫格
 * @param {string} videoPath - 影片檔案的絕對路徑
 * @param {number} frameCount - 要抽取的畫格數量
 * @returns {Promise<string[]>} 一個包含所有暫存畫格圖片路徑的陣列
 */
async function extractKeyFrames(videoPath, frameCount = 3) {
    const duration = getVideoDuration(videoPath);
    if (duration <= 0) {
        console.error('[extractKeyFrames] Cannot get video duration or duration is zero.');
        return [];
    }

    const framePaths = [];
    // 建立一個暫存資料夾來存放抽取的畫格
    const tempDir = path.join(UPLOAD_BASE_DIR, 'temp_frames');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // 計算每個畫格的抽取時間點（例如，對於3個畫格，在 25%, 50%, 75% 處抽取）
    const interval = duration / (frameCount + 1);

    for (let i = 1; i <= frameCount; i++) {
        const timestamp = interval * i;
        // 將秒數轉換為 HH:MM:SS 格式
        const timestampFormatted = new Date(timestamp * 1000).toISOString().substr(11, 8);
        const outputFramePath = path.join(tempDir, `frame_${path.basename(videoPath)}_${i}_${Date.now()}.jpg`);
        
        try {
            // -ss: 定位到時間點
            // -vframes 1: 只抽取一個畫格
            // -q:v 2: 輸出高品質的 JPG 圖片
            // -update 1: 確保 ffmpeg 正確寫入單一圖片檔案，避免報錯
            const command = `ffmpeg -y -ss ${timestampFormatted} -i "${videoPath}" -vframes 1 -q:v 2 -update 1 "${outputFramePath}"`;
            execSync(command, { stdio: 'pipe' }); // 使用 'pipe' 避免在 console 中輸出大量 ffmpeg log

            if (fs.existsSync(outputFramePath)) {
                framePaths.push(outputFramePath);
                console.log(`[extractKeyFrames] Successfully extracted frame at ${timestamp.toFixed(2)}s to ${outputFramePath}`);
            }
        } catch (error) {
            console.error(`[ffmpeg] Error extracting frame for ${videoPath} at ${timestampFormatted}:`, error.stderr ? error.stderr.toString() : error);
        }
    }

    return framePaths;
}

module.exports = {
    extractKeyFrames,
    getVideoDuration
};
