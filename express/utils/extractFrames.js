// express/utils/extractFrames.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * extractKeyFrames(videoPath, outDir, frameCount = 10)
 * 以 ffmpeg 抽指定數量的影格，限制 fps=5，最多 frameCount 張
 */
async function extractKeyFrames(videoPath, outDir, frameCount = 10) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  return new Promise((resolve, reject) => {
    const args = [
      '-i', videoPath,
      '-vf', 'fps=5',          // 每秒取5張
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
