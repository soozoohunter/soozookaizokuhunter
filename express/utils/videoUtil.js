// utils/videoUtil.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static'); // 引入 ffmpeg 可執行檔路徑
const path = require('path');

// 設定 ffmpeg 路徑（使用 ffmpeg-static 提供的內建 binary）
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * 從影片檔案中擷取指定數量的影像幀 (不再局限於前 30 秒)
 * @param {string} videoPath - 本地影片檔案路徑
 * @param {number} count - 要擷取的幀數量（預設5）
 * @return {Promise<string[]>} - 傳回擷取出的影像檔路徑陣列
 */
async function extractFrames(videoPath, count = 5) {
  return new Promise((resolve, reject) => {
    // 先使用 ffprobe 獲取影片資訊
    ffmpeg.ffprobe(videoPath, (err, data) => {
      if (err) {
        console.error('FFprobe 讀取影片資訊失敗：', err);
        return reject(new Error('無法讀取影片資訊'));
      }

      const duration = data.format.duration; // 影片總時長（秒）
      if (!duration || duration <= 0) {
        return reject(new Error('影片時長無效'));
      }

      // 如果只想擷取前 60 秒，可改用：
      // const limit = Math.min(duration, 60);

      // 這裡示範「整支影片」都可以擷取
      const limit = duration;

      // 平均分 count 個時間點
      const interval = limit / (count + 1);
      const timemarks = [];
      for (let i = 1; i <= count; i++) {
        const t = (i * interval).toFixed(2);
        timemarks.push(t);
      }

      // 輸出到與影片相同的目錄下
      const outputFolder = path.dirname(videoPath);
      const options = {
        timemarks,
        filename: '%b_frame_%i.png', // e.g. 原始檔名_frame_1.png
        folder: outputFolder
      };

      let generatedFiles = [];
      ffmpeg(videoPath)
        .screenshots(options)
        .on('filenames', (filenames) => {
          // 記錄實際擷取到的檔名
          generatedFiles = filenames.map(name => path.join(outputFolder, name));
        })
        .on('end', () => {
          console.log(`影片幀擷取完成，共生成 ${generatedFiles.length} 張圖片`);
          resolve(generatedFiles);
        })
        .on('error', (err) => {
          console.error('影片擷取幀失敗：', err);
          reject(new Error('影片幀擷取失敗'));
        });
    });
  });
}

module.exports = { extractFrames };
