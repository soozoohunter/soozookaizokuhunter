/**
 * services/flickerService.js
 *
 * 改良增強版 flickerEncode：整合多層次擾動
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncodeAdvanced - 多層次的「純軟體防側錄」FFmpeg 濾鏡
 *
 * @param {string} inputPath   - 輸入檔 (影片檔，或已先轉成影片的圖檔)
 * @param {string} outputPath  - 輸出防錄製檔 (.mp4)
 * @param {object} options     - 各種干擾參數
 *
 * 建議保留的參數：
 *  - useSubPixelShift : 是否啟用子像素平移 (mod(N,2))
 *  - useMaskOverlay   : 是否在畫面中央疊加遮罩
 *  - useRgbSplit      : 是否啟用 RGB 三通道錯位
 *  - flickerFps       : 輸出幀率 (建議 60 或 120)
 *  - noiseStrength    : 雜訊強度 (0~100)
 *  - colorCurveDark   : 壓暗用曲線
 *  - colorCurveLight  : 提亮用曲線
 *  - drawBoxSeconds   : 每隔幾秒出現方塊
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
    // (A) 若啟用 AI 對抗擾動 => python 腳本
    let encodeInput = inputPath;
    let aiTempPath  = '';

    if (useAiPerturb) {
      try {
        aiTempPath = path.join(path.dirname(outputPath), `tmpAi_${Date.now()}.mp4`);
        // ★須先實作 aiPerturb.py
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, {
          stdio:'inherit'
        });
        encodeInput = aiTempPath;
      } catch (errPy) {
        console.error('[AI Perturb Error]', errPy);
        // 若失敗則回退到原輸入
        encodeInput = inputPath;
      }
    }

    // (B) 第1階段濾鏡
    //    - format=rgb24
    //    - colorchannelmixer => 紅色略強
    //    - curves => 壓暗/亮部
    //    - noise => 亮度通道雜訊
    //    - drawbox => 每 drawBoxSeconds 秒顯示 1 秒
    const step1Filter = [
      `format=rgb24`,
      `colorchannelmixer=1.2:0.2:0.2:0:0:0:0:0:0:0:0:0:0:0:0:1`,
      `curves=r='${colorCurveDark}':g='${colorCurveDark}':b='${colorCurveLight}'`,
      `noise=c0s=${noiseStrength}:c0f=t+u`,
      `drawbox=x=0:y=0:w='iw/2':h='ih/4':color=black@0.2:enable='lt(mod(t,${drawBoxSeconds}),1)'`
    ].join(',');

    const filters = [`[0:v]${step1Filter}[preOut]`];

    // (C) 子像素平移 => mod(N,2)
    let labelA = 'preOut';
    if (useSubPixelShift) {
      filters.push(`
        [preOut]split=2[subA][subB];
        [subA]pad=iw+1:ih:1:0:black[sA];
        [subB]pad=iw+1:ih:0:0:black[sB];
        [sA][sB]blend=all_expr='if(eq(mod(N,2),0),A,B)'[subShiftOut]
      `);
      labelA = 'subShiftOut';
    }

    // (D) 遮罩 overlay => maskOverlay
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

    // (E) RGB 分離 + mergeplanes合併
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

    // (F) fps + yuv420p
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
    const ff = spawn('ffmpeg', ffmpegArgs, { stdio:'inherit' });

    ff.on('error', err => reject(err));
    ff.on('close', code => {
      // 若有 AI 暫存檔 => 刪除
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
