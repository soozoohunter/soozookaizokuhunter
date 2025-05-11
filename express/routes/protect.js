/**
 * services/flickerService.js
 *
 * 改良增強版 flickerEncode：整合多層次擾動
 * 可在其他路由(例如 routes/protect.js) 呼叫本服務
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncodeAdvanced - 多層次的「純軟體防側錄」FFmpeg 濾鏡
 *
 * @param {string} inputPath   - 輸入檔 (影片檔，或已先行轉成影片的圖檔)
 * @param {string} outputPath  - 輸出防錄製檔 (.mp4)
 * @param {object} options     - 各種干擾參數
 *
 * 可自訂參數：
 *  - useSubPixelShift : 是否啟用子像素平移
 *  - useMaskOverlay   : 是否在畫面中央疊加半透明遮罩
 *  - maskOpacity      : 遮罩透明度 (0~1)
 *  - maskFreq         : 遮罩出現頻率，以 frame index mod(n,??) 判斷
 *  - maskSizeRatio    : 遮罩大小 (相對整個畫面)
 *  - useRgbSplit      : 是否啟用 RGB 三通道錯位
 *  - useAiPerturb     : 是否執行 AI 對抗擾動 (需另行實作 python 腳本)
 *  - flickerFps       : 輸出幀率 (建議 60 或 120；預設 120)
 *  - noiseStrength    : 雜訊強度 (0~100) / 預設 30
 *  - colorCurveDark   : 壓暗用的曲線參數
 *  - colorCurveLight  : 提亮用的曲線參數
 *  - drawBoxSeconds   : 幾秒內顯示方塊 (例如 5 => 每 5 秒顯示 1 秒)，以 t(時間) 為基準
 */
async function flickerEncodeAdvanced(
  inputPath,
  outputPath,
  {
    useSubPixelShift = true,
    useMaskOverlay   = true,
    maskOpacity      = 0.3,
    maskFreq         = 5,
    maskSizeRatio    = 0.3,
    useRgbSplit      = true,
    useAiPerturb     = false,
    flickerFps       = 120,
    noiseStrength    = 30,
    colorCurveDark   = '0/0 0.5/0.2 1/1',
    colorCurveLight  = '0/0 0.5/0.4 1/1',
    drawBoxSeconds   = 5
  } = {}
) {
  return new Promise((resolve, reject) => {
    // (A) 若啟用 AI 對抗擾動 => 先呼叫 python 腳本
    let encodeInput = inputPath;
    let aiTempPath  = '';

    if (useAiPerturb) {
      try {
        aiTempPath = path.join(
          path.dirname(outputPath),
          'tmpAi_' + Date.now() + '.mp4'
        );
        // ★需自行實作 aiPerturb.py，例如: python aiPerturb.py in.mp4 out.mp4
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, {
          stdio: 'inherit'
        });
        encodeInput = aiTempPath; // 之後以 aiTempPath 作為輸入
      } catch (errPy) {
        console.error('[AI Perturb Error]', errPy);
        // 若失敗則不中斷，只是改回用原 inputPath
        encodeInput = inputPath;
      }
    }

    // (B) 第1階段濾鏡鏈
    //    1) format=rgb24 + colorchannelmixer => 紅色略強
    //    2) curves => 壓暗/亮部
    //    3) noise => 亮度通道雜訊
    //    4) drawbox => 每 drawBoxSeconds 秒顯示 1 秒 (以 t(時間) 為基準)
    const step1Filter = [
      `format=rgb24`,
      `colorchannelmixer=1.2:0.2:0.2:0:0:0:0:0:0:0:0:0:0:0:0:1`,
      `curves=r='${colorCurveDark}':g='${colorCurveDark}':b='${colorCurveLight}'`,
      `noise=c0s=${noiseStrength}:c0f=t+u`,
      `drawbox=x=0:y=0:w='iw/2':h='ih/4':color=black@0.2:enable='lt(mod(t,${drawBoxSeconds}),1)'`
    ].join(',');

    // 輸出為 preOut
    const filters = [`[0:v]${step1Filter}[preOut]`];

    // (C) 子像素平移 => 透過 frame index 的奇偶 (mod(n,2))
    let labelA = 'preOut';
    if (useSubPixelShift) {
      filters.push(`
        [preOut]split=2[subA][subB];
        [subA]pad=iw+1:ih:1:0:black[sA];
        [subB]pad=iw+1:ih:0:0:black[sB];
        [sA][sB]blend=all_expr="if(eq(mod(n,2),0),A,B)"[subShiftOut]
      `);
      labelA = 'subShiftOut';
    }

    // (D) maskOverlay => 以 frame index n 判斷何時顯示
    let labelB = labelA;
    if (useMaskOverlay) {
      filters.push(`
        color=size=16x16:color=red@${maskOpacity}[maskSrc];
        [${labelA}]scale=trunc(iw/2)*2:trunc(ih/2)*2[baseScaled];
        [maskSrc]scale=iw*${maskSizeRatio}:ih*${maskSizeRatio}[maskBig];
        [baseScaled][maskBig]
        overlay=x='(W-w)/2':y='(H-h)/2'
                :enable='lt(mod(n,${maskFreq}),1)'
        [maskedOut]
      `);
      labelB = 'maskedOut';
    }

    // (E) RGB 分離
    let finalLabel = labelB;
    if (useRgbSplit) {
      filters.push(`
        [${labelB}]split=3[r_in][g_in][b_in];
        [r_in]extractplanes=r[rp];
        [g_in]extractplanes=g[gp];
        [b_in]extractplanes=b[bp];
        [rp]pad=iw:ih:0:0:black[rout];
        [gp]pad=iw:ih:0:0:black[gout];
        [bp]pad=iw:ih:0:0:black[bout];
        [rout][gout][bout]mergeplanes=0:1:2:format=rgb24[rgbSplitOut]
      `);
      finalLabel = 'rgbSplitOut';
    }

    // (F) fps / yuv420p
    filters.push(`
      [${finalLabel}]fps=${flickerFps},format=yuv420p[finalOut]
    `);

    // 組合 filter_complex
    const filterComplex = filters.map(x => x.trim()).join(';');

    // (G) ffmpeg 參數
    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,
      '-filter_complex', filterComplex,
      '-map', '[finalOut]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-r', `${flickerFps}`,
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputPath
    ];

    console.log('[flickerEncodeAdvanced] ffmpeg =>', ffmpegArgs.join(' '));
    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    ff.on('error', err => {
      reject(err);
    });
    ff.on('close', code => {
      // 移除 AI 暫存檔
      if (aiTempPath && fs.existsSync(aiTempPath)) {
        fs.unlinkSync(aiTempPath);
      }
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`FFmpeg exited with code=${code}`));
      }
    });
  });
}

module.exports = {
  flickerEncodeAdvanced
};
