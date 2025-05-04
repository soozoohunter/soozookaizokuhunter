// express/utils/extractFrames.js

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

if(ffmpegPath){
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * extractKeyFrames - 依照 intervalSec 間隔抽圖，最多 maxCount 張。
 * 若影片超過 (intervalSec * maxCount) 秒，則只抽取該範圍內。
 * 
 * @param {string} videoPath 
 * @param {string} outputDir 
 * @param {number} intervalSec 
 * @param {number} maxCount 
 * @returns {Promise<string[]>} - 實際擷取到的 frame 檔路徑
 */
function extractKeyFrames(videoPath, outputDir, intervalSec=10, maxCount=5){
  return new Promise((resolve, reject)=>{
    if(!fs.existsSync(videoPath)) {
      return reject(new Error('Video file not found => '+videoPath));
    }
    if(!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir,{recursive:true});
    }

    // 先用 ffprobe 讀影片資訊
    ffmpeg.ffprobe(videoPath, (err, data) => {
      if(err) {
        return reject(new Error('Cannot read video info => ' + err.message));
      }
      const duration = data.format.duration||0;
      const totalSpan = intervalSec * maxCount; // ex: 10 * 5 = 50秒
      const actualSpan = Math.min(duration, totalSpan);

      // 產生 timemarks
      let timemarks = [];
      let cur = 0;
      for(let i=0; i<maxCount; i++){
        if(cur <= actualSpan) {
          timemarks.push(String(cur));
        }
        cur += intervalSec;
      }
      console.log(`[extractKeyFrames] => duration=${duration}, timemarks=`, timemarks);

      let generatedFiles = [];
      ffmpeg(videoPath)
        .on('error', err=>{
          console.error('[extractKeyFrames] ffmpeg error =>', err);
          reject(err);
        })
        .on('end', ()=>{
          console.log(`[extractKeyFrames] done => ${generatedFiles.length} frames`);
          resolve(generatedFiles);
        })
        .screenshots({
          count: timemarks.length,
          folder: outputDir,
          filename: 'frame_%i.png',
          timemarks
        })
        .on('filenames', (filenames) => {
          generatedFiles = filenames.map(n => path.join(outputDir, n));
        });
    });
  });
}

module.exports = { extractKeyFrames };
