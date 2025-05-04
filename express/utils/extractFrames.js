// express/utils/extractFrames.js

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

if(ffmpegPath){
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * extractKeyFrames
 * 依固定秒數 intervalSec 抽幀，最多 maxCount 張。
 * 若影片長度大於 (intervalSec * maxCount)，只會涵蓋前 intervalSec*maxCount 秒。
 * 例如：intervalSec=10, maxCount=5 => 最多抽到前 50 秒。
 *
 * @param {string} videoPath 
 * @param {string} outputDir 
 * @param {number} intervalSec 
 * @param {number} maxCount 
 * @returns {Promise<string[]>} 抽取到的 frame 檔路徑
 */
function extractKeyFrames(videoPath, outputDir, intervalSec=10, maxCount=5){
  return new Promise((resolve, reject)=>{
    if(!fs.existsSync(videoPath)) {
      return reject(new Error('Video file not found => '+videoPath));
    }
    if(!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir,{recursive:true});
    }

    ffmpeg.ffprobe(videoPath, (err, data) => {
      if(err) {
        return reject(new Error('Cannot read video info => ' + err.message));
      }
      const duration = data.format.duration; // 影片秒數

      // 我們限定只抽前 (intervalSec * maxCount) 秒
      // 假設 intervalSec=10, maxCount=5 => 只抽 0, 10, 20, 30, 40
      // 超過 50 秒的部分就不再擷取
      const totalSpan = intervalSec * maxCount;
      const actualSpan = Math.min(duration, totalSpan);

      // 計算 timemarks (0秒開始)
      const timemarks = [];
      let curSec = 0;
      for(let i=0; i<maxCount; i++){
        if(curSec <= actualSpan) {
          timemarks.push(String(curSec));
        }
        curSec += intervalSec;
      }

      console.log(`[extractKeyFrames] duration=${duration}, actualSpan=${actualSpan}, timemarks=`, timemarks);

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
          count: timemarks.length,  // timemarks數量可能小於 maxCount (影片太短)
          folder: outputDir,
          filename: 'frame_%i.png',
          timemarks
        })
        .on('filenames', (filenames) => {
          generatedFiles = filenames.map(name => path.join(outputDir, name));
        });
    });
  });
}

module.exports = { extractKeyFrames };
