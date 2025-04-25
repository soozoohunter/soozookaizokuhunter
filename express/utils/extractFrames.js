// express/utils/extractFrames.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * extractKeyFrames(videoPath, outDir, frameCount = 10)
 *  - 使用 ffmpeg，fps=5, 最多抽 frameCount 張影格
 *  - 若 outDir 不存在則自動建立
 *  - 以 Promise 回傳抽出的 frame 路徑陣列(已排序)
 */
async function extractKeyFrames(videoPath, outDir, frameCount = 10) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  return new Promise((resolve, reject) => {
    const args = [
      '-i', videoPath,
      '-vf', 'fps=5',  // 每秒最多5張
      '-vframes', `${frameCount}`,
      path.join(outDir, 'frame_%05d.jpg')
    ];
    const ff = spawn('ffmpeg', args);

    ff.on('error', err => reject(err));
    ff.on('exit', code => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg exit code ${code}`));
      }
      // 收集 outDir 中 frame_XXXXX.jpg
      const files = fs.readdirSync(outDir)
        .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
        .map(f => path.join(outDir, f))
        .sort();
      resolve(files);
    });
  });
}

module.exports = { extractKeyFrames };
