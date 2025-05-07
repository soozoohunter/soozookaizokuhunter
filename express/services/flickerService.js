const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncode (增強版)
 */
async function flickerEncode(inputPath, outputPath, {
  // 基本參數
  useRgbSplit = false,
  useRandomFlicker = false,
  useSubPixelShift = false,
  useAiPerturb = false,

  // 高階可選參數
  useHueFlicker = false,       // 開啟亮度/色相周期閃爍
  hueFlickerAmp = 0.1,         // 閃爍幅度(0~1之間，一般0.1~0.2)
  useMaskOverlay = false,
  maskOpacity = 0.2,
  maskFreq = 5,                // 每5幀(或根據fps)疊加一次遮罩
  maskSizeRatio = 0.3,         // 遮罩佔畫面大小比例(舉例0.3 = 30%)
} = {}) {
  return new Promise((resolve, reject) => {
    let encodeInput = inputPath;
    let aiTempPath = '';

    // (A) 可選：AI對抗擾動 (同原本)
    if (useAiPerturb) {
      try {
        aiTempPath = path.join(path.dirname(outputPath), 'tmpAi_' + Date.now() + '.mp4');
        execSync(`python aiPerturb.py "${inputPath}" "${aiTempPath}"`, { stdio: 'inherit' });
        encodeInput = aiTempPath;
      } catch (err) {
        console.error('[AI Perturb error]', err);
      }
    }

    // (B) 組裝 FFmpeg 濾鏡
    // 先建立一個陣列 filters，用來逐一拼接
    // 1) 輸入別名 [0:v]
    let filters = [];
    // 目標：最終把全部組合後 -> [finalOut]

    // 1. 先對畫面做「亮暗交替」or「隨機閃爍」
    // ------------------------------------------------
    let flickerExpr = useRandomFlicker
      ? `'if(gt(random(0),0.5),A,B)'`
      : `'if(eq(mod(N,2),0),A,B)'`;
    // eq=brightness=... 這裡可以替換成更動態的表達式 (如 sin / cos)
    // 若要加 hue flicker => 可用 hue=H='H+someFunc(N)'
    // ex: hue=s='1':h='2*PI*t*freq'
    //
    // 這裡示範"亮度或對比"小幅閃爍 (eq=gamma=...), 也可 hue=...
    let eqFlickerStr = ''; 
    if (useHueFlicker) {
      // 假設我們用 gamma 或亮度
      // brightness +/- hueFlickerAmp
      // 例如 brightness=0.0 ± 0.1 => -0.1與+0.1在偶/奇幀間切換
      eqFlickerStr = `eq=brightness='if(eq(mod(N,2),0),${hueFlickerAmp},-${hueFlickerAmp})'`;
    } else {
      // 舊的固定 -0.8
      eqFlickerStr = 'eq=brightness=-0.8';
    }

    filters.push(`
      [0:v]split=2[main][alt];
      [alt]${eqFlickerStr}[altout];
      [main][altout]blend=all_expr=${flickerExpr}[flickerOut]
    `);

    // 2. 可選：子像素偏移
    // ------------------------------------------------
    // 與原邏輯類似
    let subShiftOutputLabel = 'flickerOut';
    if (useSubPixelShift) {
      // subShift
      filters.push(`
        [flickerOut]split=2[s1][s2];
        [s1]pad=iw+2:ih:2:0:black[subA];
        [s2]pad=iw+2:ih:0:0:black[subB];
        [subA][subB]blend=all_expr='if(eq(mod(N,2),0),A,B)'[subShiftOut]
      `);
      subShiftOutputLabel = 'subShiftOut';
    }

    // 3. 可選：局部遮罩
    // ------------------------------------------------
    // 每隔 maskFreq 幀, 在畫面中央(或隨機)疊加一塊半透明黑矩形
    // ffmpeg overlay trick: 先產生 color source => overlay
    // color=c=black@0.3: size=...
    // if(eq(mod(N,maskFreq),0),1,0) => 1時顯示,0時不顯示
    let maskOutputLabel = subShiftOutputLabel;
    if (useMaskOverlay) {
      // 首先產生一個臨時黑色畫布(與輸入大小相同), 透明度=maskOpacity
      // eg: "color=c=black@0.2:size=1280x720:duration=999999[mask];"
      // 但我們只想畫一塊區域 => 可再用 crop 或 drawbox
      let overlayCmd = `
        color=size=16x16:color=black@${maskOpacity}[tinyMask];
        [${subShiftOutputLabel}]scale=trunc(iw/2)*2:trunc(ih/2)*2[base]; 
        [tinyMask]scale=iw*${maskSizeRatio}:ih*${maskSizeRatio}[maskBig];
        [base][maskBig]overlay=x='(W-w)/2':y='(H-h)/2':enable='lt(mod(N,${maskFreq}),1)'[maskedOut]
      `;
      filters.push(overlayCmd);
      maskOutputLabel = 'maskedOut';
    }

    // 4. 可選：RGB 分離
    // ------------------------------------------------
    let finalLabel = maskOutputLabel;
    if (useRgbSplit) {
      // 直接複用原本 rgb 交錯
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

    // 將 filters 合併成一段
    let filterComplex = filters
      .map(l => l.trim())
      .join('; ');

    // (C) 執行 ffmpeg
    const fpsOut = '60'; // 保持60fps
    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,
      '-filter_complex', filterComplex,
      '-map', `[${finalLabel}]`,
      '-r', fpsOut,
      '-c:v', 'libx264',
      '-preset','medium',
      '-pix_fmt','yuv420p',
      outputPath
    ];
    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    ff.on('error', err => reject(err));
    ff.on('close', code => {
      if (aiTempPath && fs.existsSync(aiTempPath)) {
        fs.unlinkSync(aiTempPath);
      }
      if (code===0) resolve(true);
      else reject(new Error(`flickerEncode error, code=${code}`));
    });
  });
}

module.exports = { flickerEncode };
