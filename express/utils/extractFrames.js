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
 * 依固定秒數 interval 抽幀，最多 maxCount 張
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
    // 建立 timemarks
    const timemarks=[];
    for(let i=0; i<maxCount; i++){
      timemarks.push(String(i*intervalSec));
    }
    ffmpeg(videoPath)
      .on('error', err=>reject(err))
      .on('end', ()=>{
        const frames=[];
        for(let i=1; i<=maxCount; i++){
          const fp = path.join(outputDir, `frame_${i}.png`);
          if(fs.existsSync(fp)){
            frames.push(fp);
          }
        }
        resolve(frames);
      })
      .screenshots({
        count:maxCount,
        folder:outputDir,
        filename:'frame_%i.png',
        timemarks
      });
  });
}

module.exports = { extractKeyFrames };
