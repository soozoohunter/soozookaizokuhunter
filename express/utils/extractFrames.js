// express/utils/extractFrames.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * extractKeyFrames(videoPath, outDir, frameCount=10)
 * - 使用 ffmpeg，每秒 ~5fps，最多擷取 frameCount 張
 * - 回傳 Promise => 已排序好的 JPG 檔案路徑清單
 */
async function extractKeyFrames(videoPath, outDir, frameCount = 10) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive:true });
  }
  return new Promise((resolve, reject) => {
    const args = [
      '-i', videoPath,
      '-vf', 'fps=5',
      '-vframes', `${frameCount}`,
      path.join(outDir, 'frame_%05d.jpg')
    ];
    const ff = spawn('ffmpeg', args);

    ff.on('error', err => reject(err));
    ff.on('exit', code => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg exit code ${code}`));
      }
      const files = fs.readdirSync(outDir)
        .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
        .map(f => path.join(outDir, f))
        .sort();
      resolve(files);
    });
  });
}

module.exports = { extractKeyFrames };
