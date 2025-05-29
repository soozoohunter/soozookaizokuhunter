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
 * 
 * @returns {Promise} - 允諾成功則表示 FFmpeg 成功產出檔案
 *                      失敗則丟出 Error (帶有詳細的錯誤訊息)
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

    // (若需 AI 擾動) => 先呼叫您假設存在的 Python 腳本: aiPerturb.py
    // 如果失敗 => fallback 用原 inputPath
    if (useAiPerturb) {
      try {
        aiTempPath = path.join(
          path.dirname(outputPath),
          'tmpAi_' + Date.now() + '.mp4'
        );
        console.log('[flickerEncodeAdvanced] try AI perturb => python aiPerturb.py ...');
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, {
          stdio: 'inherit',
        });
        encodeInput = aiTempPath;
        console.log('[flickerEncodeAdvanced] AI perturb success => useAiPerturb=true');
      } catch (errPy) {
        console.error('[AI Perturb Error] => fallback to original input:', errPy.message);
        encodeInput = inputPath;
      }
    }

    // step1：基本濾鏡（顏色擾動、畫面雜訊、動態黑框等）
    const step1Filter = [
      // 轉成 RGB24 方便做後續處理
      `format=rgb24`,
      // 顏色信道稍作不同比例 (增加些許偏色感)
      `colorchannelmixer=1.2:0.2:0.2:0:0:0:0:0:0:0:0:0:0:0:0:1`,
      // 亮度對比曲線
      `curves=r='${colorCurveDark}':g='${colorCurveDark}':b='${colorCurveLight}'`,
      // 視頻雜訊
      `noise=c0s=${noiseStrength}:c0f=t+u`,
      // 動態黑框 (隔一段時間出現)
      `drawbox=x=0:y=0:w='iw/2':h='ih/4':color=black@0.2:enable='lt(mod(t,${drawBoxSeconds}),1)'`
    ].join(',');

    // 組合 filter
    // 先給第一段標籤 [preOut]
    const filters = [`[0:v]${step1Filter}[preOut]`];

    // (A) subPixelShift
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

    // (B) maskOverlay
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

    // (C) RGB Split
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
        [rout][gout][bout]mergeplanes=0:0:0:-1:format=rgb24[rgbSplitOut]
      `);
      finalLabel = 'rgbSplitOut';
    }

    // 最後：調整輸出 fps + 轉回 yuv420p
    filters.push(`
      [${finalLabel}]fps=${flickerFps},format=yuv420p[finalOut]
    `);

    // 組合完整的 filter_complex
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

    // 啟動 ffmpeg
    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    // 若 ffmpeg 執行程序本身出錯 (找不到 ffmpeg, 權限不夠等)
    ff.on('error', err => {
      return reject(new Error(`[FFmpeg spawn error] => ${err.message}`));
    });

    // ffmpeg 結束 => 根據 code 判斷成功或失敗
    ff.on('close', code => {
      // 若有產生 AI 暫存檔 => 處理完畢刪除
      if (aiTempPath && fs.existsSync(aiTempPath)) {
        fs.unlinkSync(aiTempPath);
      }

      if (code === 0) {
        // 成功
        resolve(true);
      } else {
        // 失敗 => 依 code 提供更明確訊息 (127 => ffmpeg not found, 1 => 參數錯誤... etc)
        let extra = '';
        if (code === 127) {
          extra = ' (可能是系統找不到 ffmpeg？)';
        } else if (code === 1) {
          extra = ' (可能是 ffmpeg 參數錯誤或檔案無法讀取)';
        }
        reject(new Error(`FFmpeg exited with code=${code}${extra}`));
      }
    });
  });
}

module.exports = {
  flickerEncodeAdvanced
};
