// kaiShield/flickerService.js

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncode (增強版)
 * 支援：
 *   - AI 擾動: useAiPerturb=true => 直接呼叫 aiPerturb.py
 *   - Hue Flicker: useHueFlicker => hueFlickerAmp
 *   - 隨機閃爍: useRandomFlicker
 *   - 子像素偏移: useSubPixelShift
 *   - 局部遮罩: useMaskOverlay
 *   - RGB 分離: useRgbSplit
 */
async function flickerEncode(inputPath, outputPath, {
  // 基本參數
  useRgbSplit = false,
  useRandomFlicker = false,
  useSubPixelShift = false,
  useAiPerturb = false,

  // 高階可選參數
  useHueFlicker = false,    // 是否開啟亮度/色相周期閃爍
  hueFlickerAmp = 0.1,      // 閃爍幅度(0~1之間)，預設0.1
  useMaskOverlay = false,
  maskOpacity = 0.2,
  maskFreq = 5,             // 每 5 幀插入一次遮罩
  maskSizeRatio = 0.3,      // 遮罩佔畫面大小比例(預設0.3=30%)
} = {}) {

  return new Promise((resolve, reject) => {
    let encodeInput = inputPath;   // 最終要給 FFmpeg 處理的檔案
    let aiTempPath = '';           // 若啟用 AI擾動 => 暫存檔

    // (A) 可選：AI 對抗擾動 (aiPerturb.py)
    // ------------------------------------------------
    if (useAiPerturb) {
      try {
        aiTempPath = path.join(path.dirname(outputPath), 'tmpAi_' + Date.now() + '.mp4');
        // 執行 aiPerturb.py
        //  - inputPath  =>  aiTempPath
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, { stdio: 'inherit' });
        // 後續 FFmpeg 輸入就改用這個檔
        encodeInput = aiTempPath;
      } catch (err) {
        console.error('[AI Perturb error]', err);
        // 不強制中斷，若失敗就直接用原 inputPath
      }
    }

    // (B) 組裝 FFmpeg 濾鏡 filter_complex
    // ------------------------------------------------
    let filters = [];

    // 1. 亮暗(或隨機)閃爍
    //    eq=brightness=...
    //    blend=all_expr=...
    let flickerExpr = useRandomFlicker
      ? `'if(gt(random(0),0.5),A,B)'`
      : `'if(eq(mod(N,2),0),A,B)'`;

    // 如果 useHueFlicker => 動態 brightness; 否則固定 -0.8
    let eqFlickerStr = '';
    if (useHueFlicker) {
      // brightness= ± hueFlickerAmp
      eqFlickerStr = `eq=brightness='if(eq(mod(N,2),0),${hueFlickerAmp},-${hueFlickerAmp})'`;
    } else {
      eqFlickerStr = 'eq=brightness=-0.8';
    }

    filters.push(`
      [0:v]split=2[main][alt];
      [alt]${eqFlickerStr}[altout];
      [main][altout]blend=all_expr=${flickerExpr}[flickerOut]
    `);

    // 2. 子像素偏移 (可選)
    let subShiftOutputLabel = 'flickerOut';
    if (useSubPixelShift) {
      // shift 2px => 先 split => pad => blend
      filters.push(`
        [flickerOut]split=2[s1][s2];
        [s1]pad=iw+2:ih:2:0:black[subA];
        [s2]pad=iw+2:ih:0:0:black[subB];
        [subA][subB]blend=all_expr='if(eq(mod(N,2),0),A,B)'[subShiftOut]
      `);
      subShiftOutputLabel = 'subShiftOut';
    }

    // 3. 局部遮罩 Overlay (可選)
    //    每隔 maskFreq 幀, 在畫面中央疊加黑色半透明方塊
    let maskOutputLabel = subShiftOutputLabel;
    if (useMaskOverlay) {
      // color -> scale -> overlay with enable='lt(mod(N,maskFreq),1)'
      let overlayCmd = `
        color=size=16x16:color=black@${maskOpacity}[tinyMask];
        [${subShiftOutputLabel}]scale=trunc(iw/2)*2:trunc(ih/2)*2[base];
        [tinyMask]scale=iw*${maskSizeRatio}:ih*${maskSizeRatio}[maskBig];
        [base][maskBig]overlay=x='(W-w)/2':y='(H-h)/2':enable='lt(mod(N,${maskFreq}),1)'[maskedOut]
      `;
      filters.push(overlayCmd);
      maskOutputLabel = 'maskedOut';
    }

    // 4. RGB 分離 (可選)
    let finalLabel = maskOutputLabel;
    if (useRgbSplit) {
      // 先 split=3 => extractplanes => interleave => [rgbsplitOut]
      filters.push(`
        [${maskOutputLabel}]split=3[r][g][b];
        [r]extractplanes=r[rc];
        [g]extractplanes=g[gc];
        [b]extractplanes=b[bc];
        [rc]pad=iw:ih:0:0:black[rout];
        [gc]pad=iw:ih:0:0:black[gout];
        [bc]pad=iw:ih:0:0:black[bout];
        [rout][gout][bout]interleave=0,format=yuv444p[rgbsplitOut]
      `);
      finalLabel = 'rgbsplitOut';
    }

    // 組合 filter
    let filterComplex = filters
      .map(line => line.trim())
      .join('; ');

    // (C) 執行 FFmpeg
    // 預設輸出 60fps，確保人眼閃爍融合
    let fpsOut = '60';

    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,
      '-filter_complex', filterComplex,
      '-map', `[${finalLabel}]`,
      '-r', fpsOut,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-pix_fmt', 'yuv420p',
      outputPath
    ];

    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    ff.on('error', err => reject(err));
    ff.on('close', code => {
      // 清理 AI暫存檔
      if (aiTempPath && fs.existsSync(aiTempPath)) {
        fs.unlinkSync(aiTempPath);
      }
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`flickerEncode ffmpeg error, code=${code}`));
      }
    });
  });
}

module.exports = { flickerEncode };
