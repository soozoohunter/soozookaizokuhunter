/**
 * express/services/flickerService.js
 *
 * 改良增強版 flickerEncode：整合多層次擾動
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncodeAdvanced - 多層次的「純軟體防側錄」FFmpeg 濾鏡
 * @param {String} inputPath      - 輸入檔(通常是影片 or 已先轉成影片的圖片)
 * @param {String} outputPath     - 輸出檔路徑 (mp4)
 * @param {Object} options        - 保護細節選項
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
    let encodeInput = inputPath;
    let aiTempPath  = '';

    // (若需 AI 擾動)
    if(useAiPerturb){
      try {
        aiTempPath = path.join(
          path.dirname(outputPath),
          'tmpAi_' + Date.now() + '.mp4'
        );
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, {
          stdio: 'inherit',
        });
        encodeInput = aiTempPath; 
      } catch (errPy) {
        console.error('[AI Perturb Error]', errPy);
        encodeInput = inputPath;
      }
    }

    // 第一步基本濾鏡
    const step1Filter = [
      `format=rgb24`,
      `colorchannelmixer=1.2:0.2:0.2:0:0:0:0:0:0:0:0:0:0:0:0:1`,
      `curves=r='${colorCurveDark}':g='${colorCurveDark}':b='${colorCurveLight}'`,
      `noise=c0s=${noiseStrength}:c0f=t+u`,
      `drawbox=x=0:y=0:w='iw/2':h='ih/4':color=black@0.2:enable='lt(mod(t,${drawBoxSeconds}),1)'`
    ].join(',');

    // 組合 filter
    const filters = [`[0:v]${step1Filter}[preOut]`];

    // subPixelShift
    let labelA = 'preOut';
    if(useSubPixelShift){
      filters.push(`
        [preOut]split=2[subA][subB];
        [subA]pad=iw+1:ih:1:0:black[sA];
        [subB]pad=iw+1:ih:0:0:black[sB];
        [sA][sB]blend=all_expr='if(eq(mod(N,2),0),A,B)'[subShiftOut]
      `);
      labelA = 'subShiftOut';
    }

    // maskOverlay
    let labelB = labelA;
    if(useMaskOverlay){
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

    // rgbSplit
    let finalLabel = labelB;
    if(useRgbSplit){
      filters.push(`
        [${labelB}]split=3[r_in][g_in][b_in];
        [r_in]extractplanes=r[rp];
        [g_in]extractplanes=g[gp];
        [b_in]extractplanes=b[bp];
        [rp]pad=iw:ih:0:0:black[rout];
        [gp]pad=iw:ih:0:0:black[gout];
        [bp]pad=iw:ih:0:0:black[bout];
        [rout][gout][bout]interleave=0,format=rgb24[rgbSplitOut]
      `);
      finalLabel = 'rgbSplitOut';
    }

    // 結尾
    filters.push(`
      [${finalLabel}]fps=${flickerFps},format=yuv420p[finalOut]
    `);

    const filterComplex = filters.map(x => x.trim()).join(';');

    // ffmpeg arguments
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
      if(aiTempPath && fs.existsSync(aiTempPath)){
        fs.unlinkSync(aiTempPath);
      }
      if(code === 0){
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
