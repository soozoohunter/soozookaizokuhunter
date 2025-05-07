// flickerService.js
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncode - 使用 Python高頻擾動 + FFmpeg再加工
 *
 * @param {string} inputPath   - 原始影片
 * @param {string} outputPath  - 最終輸出防護 mp4
 * @param {object} options     - {
 *    doMask: bool,   // 是否在畫面上加動態遮罩
 *    doRgbSplit: bool, ...
 *    ...
 * }
 */
async function flickerEncode(inputPath, outputPath, options={}) {
  const {
    doMask=false,
    doRgbSplit=false,
    doSubPixelShift=false,
    doRandomFlicker=false,
    doAiPerturb=false
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // Step1: 若 doAiPerturb => 執行 aiPerturb.py
      let stage1Input = inputPath;
      let tmpAiPath = '';
      if (doAiPerturb) {
        tmpAiPath = path.join(path.dirname(outputPath), 'tmpAi_'+Date.now()+'.mp4');
        const cmdAi = `python aiPerturb.py "${inputPath}" "${tmpAiPath}"`;
        try {
          execSync(cmdAi, {stdio:'inherit'});
          stage1Input = tmpAiPath; // 後續以此檔案為輸入
        } catch(e) {
          console.error('AI Perturb Error:', e);
        }
      }

      // Step2: 執行 python highfreq_perturb (可選)
      let tmpHighFreqPath = path.join(path.dirname(outputPath), 'tmpHigh_'+Date.now()+'.mp4');
      let cmdHf = `python highfreq_perturb.py "${stage1Input}" "${tmpHighFreqPath}"`;
      if (doMask) cmdHf += ' --mask'; // 選擇性加遮罩
      // 執行
      execSync(cmdHf, {stdio:'inherit'});

      // Step3: 再用 ffmpeg 做RGB分離或其他
      let finalInput = tmpHighFreqPath;

      let ffmpegFilters = [];
      // brightness flicker 已在python做了 => 這裡可以關掉
      // if (doRandomFlicker) ... or any other
      // if (doSubPixelShift) ... (python 也已做)
      if (doRgbSplit) {
        // 加入RGB通道分離
        // 參考您原本的 filterRgb
        ffmpegFilters.push(
          "[0:v]split=3[r][g][b]; " +
          "[r]extractplanes=r[rc]; [g]extractplanes=g[gc]; [b]extractplanes=b[bc]; " +
          "[rc]pad=iw:ih:0:0:black[rout]; " +
          "[gc]pad=iw:ih:0:0:black[gout]; " +
          "[bc]pad=iw:ih:0:0:black[bout]; " +
          "[rout][gout][bout]interleave=0,format=yuv444p[fv]"
        );
      }

      // 目標fps
      let fpsOut = '60'; // python已倍增, 這裡暫時保持60fps
      // Step4: spawn ffmpeg
      const ffmpegArgs = ['-y','-i', finalInput];
      if (ffmpegFilters.length>0) {
        ffmpegArgs.push('-filter_complex', ffmpegFilters.join(' '));
        ffmpegArgs.push('-map','[fv]');
      }
      ffmpegArgs.push('-r', fpsOut);
      ffmpegArgs.push('-c:v','libx264','-preset','medium','-pix_fmt','yuv420p', outputPath);

      const ff = spawn('ffmpeg', ffmpegArgs, {stdio:'inherit'});
      ff.on('error', (err)=>reject(err));
      ff.on('close', (code)=>{
        // 清理 tmpAiPath, tmpHighFreqPath
        if (tmpAiPath && fs.existsSync(tmpAiPath)) fs.unlinkSync(tmpAiPath);
        if (tmpHighFreqPath && fs.existsSync(tmpHighFreqPath)) fs.unlinkSync(tmpHighFreqPath);

        if (code===0) resolve(true);
        else reject(new Error('ffmpeg process exited with code '+code));
      });

    } catch(err) {
      reject(err);
    }
  });
}

module.exports = { flickerEncode };
