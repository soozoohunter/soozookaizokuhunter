// flickerService.js
// 此檔案用來對影片或圖片進行「高頻閃爍 + 隨機閃爍 + RGB分離 + 子像素偏移 + AI擾動」等綜合處理。
// 產生最終 mp4 檔，使螢幕錄影工具大部分情況下錄到黑屏或嚴重失真。

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncode
 * @param {string} inputPath   - 原始影片或已轉成短影片的圖片
 * @param {string} outputPath  - 最終輸出防護檔案路徑 (mp4)
 * @param {boolean} useRgbSplit - true 表示在「亮暗交替」後也做RGB通道分離
 * @param {boolean} useRandomFlicker - 是否啟用隨機閃爍(比固定奇偶幀更難復原)
 * @param {boolean} useSubPixelShift - 是否啟用子像素偏移
 * @param {boolean} useAiPerturb   - 若為true，會呼叫 aiPerturb.py 先對原檔做AI擾動，再給ffmpeg處理
 *
 * 流程：
 *   1) (可選) AI擾動 => 產生tmpAi.mp4
 *   2) ffmpeg => 閃爍/顏色/偏移等
 *   3) 輸出 => outputPath
 */
async function flickerEncode(inputPath, outputPath, {
  useRgbSplit = false,
  useRandomFlicker = false,
  useSubPixelShift = false,
  useAiPerturb = false
} = {}) {

  return new Promise((resolve, reject) => {

    // 1) 若需AI擾動 => 先呼叫 aiPerturb.py
    //    生成一個中繼檔 tmpAi.mp4，後續ffmpeg輸入就改 tmpAi
    let encodeInput = inputPath;
    let aiTempPath = '';
    if (useAiPerturb) {
      try {
        aiTempPath = path.join(path.dirname(outputPath), 'tmpAi_' + Date.now() + '.mp4');
        // 假設已經裝好 python + OpenCV
        // 注意：此處 aiPerturb.py 路徑自行調整
        execSync(`python aiPerturb.py "${inputPath}" "${aiTempPath}"`, { stdio: 'inherit' });
        encodeInput = aiTempPath;
      } catch (err) {
        console.error('[AI Perturb error]', err);
        // 若AI失敗，不影響後續，只是無法加擾動
      }
    }

    // 2) 組裝 filterCmd: 包含 (a)隨機閃爍, (b)亮暗交替, (c)RGB分離, (d)子像素偏移
    let fpsOut = '60';

    // (A) 隨機閃爍 vs. 固定奇偶
    // 如果 useRandomFlicker = true, 則我們用Lua等conditional:
    // 參考: https://ffmpeg.org/ffmpeg-filters.html#blend-1 (all_expr)
    // 不同做法：可將 mod(N,2) 改為 rand(0) < 0.5 => 0 or 1
    // ffmpeg不直接支援 rand() in blend expr，但可用 random() or read from volume.
    // 這裡做個示範 trick: 先用 minterpolate or some approach
    let flickerExpr = useRandomFlicker
      ? `'if(gt(random(0),0.5),A,B)'`
      : `'if(eq(mod(N,2),0),A,B)'`;

    // (B) 亮暗交替 eq=brightness=-0.8
    // 先產生dark分支 => blend => flicker
    let filterFlicker = `
      [0:v]split=2[main][alt];
      [alt]eq=brightness=-0.8[dark];
      [main][dark]blend=all_expr=${flickerExpr}[flickerOut]
    `.trim();

    // (C) 子像素偏移 (optional)
    // 如果啟用 => 在 flickerOut 基礎上再 pad/hshift/vshift
    // 簡易示例: 偶數影格水平偏移2px, 奇數不偏移 => 需要 framestep or tile approach
    // 這裡用 tblend or overlay trick
    // 但為簡化示範:
    let filterSubShift = '';
    if (useSubPixelShift) {
      // shift 2px to right on even frames, 0px on odd frames
      // 先分割 => overlay => x='if(eq(mod(N,2),0),2,0)'
      filterSubShift = `
        [flickerOut]split=2[s1][s2];
        [s1]pad=iw+2:ih:2:0:black[subA];
        [s2]pad=iw+2:ih:0:0:black[subB];
        [subA][subB]blend=all_expr='if(eq(mod(N,2),0),A,B)'
      `.trim();
    }

    // (D) RGB分離 (optional)
    let filterRgb = '';
    if (useRgbSplit) {
      // 假設在最後再拆 [something]split=3 => [r][g][b]
      // 需要前面的結果 => 直接把結果視為 [subfinal] 之後 => split=3
      // 以yuv444p保留完整顏色
      filterRgb = `
        split=3[r][g][b];
        [r]extractplanes=r[rc];
        [g]extractplanes=g[gc];
        [b]extractplanes=b[bc];
        [rc]pad=iw:ih:0:0:black[rout];
        [gc]pad=iw:ih:0:0:black[gout];
        [bc]pad=iw:ih:0:0:black[bout];
        [rout][gout][bout]interleave=0,format=yuv444p
      `.trim();
      // fpsOut = '90'; // 可能想3倍fps
    }

    // 串接 filter
    let finalFilter = '';
    if (!useSubPixelShift && !useRgbSplit) {
      // 只有 flicker
      finalFilter = filterFlicker + '';
    } else if (useSubPixelShift && !useRgbSplit) {
      // flicker => subshift
      finalFilter = `
        ${filterFlicker};
        ${filterSubShift}
      `;
    } else if (!useSubPixelShift && useRgbSplit) {
      // flicker => rgbsplit
      finalFilter = `
        ${filterFlicker};
        [flickerOut]${filterRgb}
      `;
    } else {
      // flicker => subshift => rgbsplit
      finalFilter = `
        ${filterFlicker};
        ${filterSubShift};
        [blend]${filterRgb}
      `.replace('[flickerOut]split=2[s1][s2];','[flickerOut]split=2[s1][s2];') 
        .replace('[subA][subB]blend','[blend]');
    }

    // 移除多餘空白行
    finalFilter = finalFilter.split('\n').map(l=>l.trim()).join('; ');

    // 3) spawn ffmpeg with finalFilter
    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,
      '-filter_complex', finalFilter,
      '-r', fpsOut,
      '-c:v', 'libx264',
      '-preset','medium',
      '-pix_fmt','yuv420p',
      outputPath
    ];
    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    ff.on('error', err => reject(err));
    ff.on('close', code => {
      // 清理 AI暫存檔
      if (aiTempPath && fs.existsSync(aiTempPath)) {
        fs.unlinkSync(aiTempPath);
      }
      if (code===0) {
        resolve(true);
      } else {
        reject(new Error(`flickerEncode ffmpeg error, code=${code}`));
      }
    });
  });
}

module.exports = { flickerEncode };
