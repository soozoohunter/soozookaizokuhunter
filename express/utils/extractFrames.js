// express/utils/extractFrames.js

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 從影片中提取關鍵影格圖像。
 * @param {string} videoPath - 視頻檔案路徑。
 * @param {string} outputDir - 輸出影格圖片的目錄。
 * @param {number} intervalSec - 每隔多少秒擷取一張影像 (預設10秒)。
 * @param {number} maxFrames - 最多擷取幾張影像 (預設5張)。
 * @returns {string[]} 產生的影像檔路徑陣列。
 */
function extractKeyFrames(videoPath, outputDir, intervalSec = 10, maxFrames = 5) {
    // 確保輸出目錄存在
    fs.mkdirSync(outputDir, { recursive: true });

    // 構建 ffmpeg 命令參數
    //  - fps=1/intervalSec => 表示每 intervalSec 秒擷取1張
    //  - -frames:v maxFrames => 最多擷取多少張
    const outputPattern = path.join(outputDir, 'frame-%02d.png');
    const args = [
        '-hide_banner',
        '-loglevel', 'error',
        '-i', videoPath,
        '-vf', `fps=1/${intervalSec}`,
        '-frames:v', maxFrames,
        outputPattern
    ];

    try {
        execFileSync('ffmpeg', args);
    } catch (err) {
        console.error('[extractFrames] ffmpeg 執行錯誤:', err);
        return [];
    }

    // 收集輸出圖片路徑
    const files = fs.readdirSync(outputDir)
        .filter(f => f.match(/^frame-\d+\.png$/))
        .map(f => path.join(outputDir, f));
    return files;
}

module.exports = { extractKeyFrames };
