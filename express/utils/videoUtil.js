// utils/videoUtil.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static'); // 引入 ffmpeg 可執行檔路徑
const path = require('path');

// 設定 ffmpeg 路徑（使用 ffmpeg-static 提供的內建 binary）
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * 從影片檔案中擷取指定數量的影像幀
 * @param {string} videoPath - 本機影片檔案路徑
 * @param {number} count - 要擷取的幀數量（預設5）
 * @return {Promise<string[]>} - 傳回擷取出的影像檔路徑陣列
 */
async function extractFrames(videoPath, count = 5) {
  return new Promise((resolve, reject) => {
    // 先使用 ffprobe 獲取影片資訊（特別是時長）
    ffmpeg.ffprobe(videoPath, (err, data) => {
      if (err) {
        console.error('FFprobe 讀取影片資訊失敗：', err);
        return reject(new Error('無法讀取影片資訊'));
      }
      const duration = data.format.duration; // 影片總時長（秒）
      // 計算截圖時間點：若影片長度超過30秒，只取前30秒範圍
      let options;
      if (duration > 30) {
        // 超過30秒則限定在0–30秒範圍內平均取幀
        const interval = 30 / (count - 1);
        const timemarks = [];
        for (let i = 0; i < count; i++) {
          const t = (i * interval).toFixed(2);
          timemarks.push(t);
        }
        options = { timemarks: timemarks, filename: '%b_frame_%i.png' };
      } else {
        // 否則由 fluent-ffmpeg 自行均勻擷取 count 張
        options = { count: count, filename: '%b_frame_%i.png' };
      }
      // 取得輸出目錄（與影片檔相同目錄）
      options.folder = path.dirname(videoPath);
      // 使用 fluent-ffmpeg 擷取影像幀
      let generatedFiles = [];
      ffmpeg(videoPath)
        .screenshots(options)
        .on('filenames', (filenames) => {
          // 紀錄擷取出的檔名列表
          generatedFiles = filenames.map(name => path.join(options.folder, name));
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
