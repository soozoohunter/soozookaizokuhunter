// kaiShield/flickerService.js

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncode (改良增強版 - 低頻區域遮罩 + 色差扭曲 + 細微雜訊)
 * 
 * 特點：
 *   - 去除原先強烈閃爍：改用 colorchannelmixer + curves 產生紅黑化，降低人眼不適。
 *   - 可選子像素偏移 (useSubPixelShift) & 局部遮罩 (useMaskOverlay) & RGB 分離 (useRgbSplit)。
 *   - 額外加入 noise=c0s=30:c0f=t+u => 在亮度通道添加中等時變噪點。
 *   - drawbox 低頻遮罩：每 5 秒內顯示 1 秒的黑(或紅)方塊，位置在左上角 (可依需求微調)。
 *   - 預設輸出 120fps, libx264, yuv420p。
 *
 * 保留 AI 擾動: useAiPerturb => 執行 aiPerturb.py 再進行 FFmpeg。
 */

async function flickerEncode(
  inputPath,
  outputPath,
  {
    // 保留舊參數(不再使用亮度閃爍)
    useRandomFlicker = false,
    useHueFlicker = false,
    hueFlickerAmp = 0.1,

    // 可用參數
    useSubPixelShift = false,  // 子像素偏移
    useMaskOverlay = false,    // 原先自訂遮罩(中央疊加)
    maskOpacity = 0.2,
    maskFreq = 5,
    maskSizeRatio = 0.3,
    useRgbSplit = false,       // RGB 分離
    useAiPerturb = false,      // AI 對抗擾動
  } = {}
) {
  return new Promise((resolve, reject) => {
    // ------------------------------------------------------------------
    // (A) 若啟用 AI 擾動 => 執行 aiPerturb.py
    // ------------------------------------------------------------------
    let encodeInput = inputPath;
    let aiTempPath = '';
    if (useAiPerturb) {
      try {
        aiTempPath = path.join(
          path.dirname(outputPath),
          'tmpAi_' + Date.now() + '.mp4'
        );
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, {
          stdio: 'inherit',
        });
        encodeInput = aiTempPath;
      } catch (err) {
        console.error('[AI Perturb error]', err);
        // 若失敗則不強制中斷 => 直接用原 inputPath
      }
    }

    // ------------------------------------------------------------------
    // (B) 組合 FFmpeg 濾鏡鏈
    //     1) colorchannelmixer+curves => 紅黑化
    //     2) noise => 亮度通道添加時變噪點
    //     3) drawbox => 低頻顯示半透明方塊
    //     4) (可選) subpixel shift => blend
    //     5) (可選) maskOverlay => 疊加中央遮罩
    //     6) (可選) rgbSplit => R/G/B分離
    //     7) fps=120 => 高幀率
    // ------------------------------------------------------------------

    let filters = [];

    // Step1: 先做 RGB24 + 紅黑化 + 雜訊 + drawbox(低頻方塊)
    //   - colorchannelmixer=1.2:0.2:0.2 => 紅通道強化 1.2, 混入少許其他通道
    //   - curves=... => 中段壓暗
    //   - noise=c0s=30:c0f=t+u => 僅亮度，強度30 + 時變 + uniform
    //   - drawbox => 每5秒之中顯示1秒: enable='lt(mod(t,5),1)'
    //                color=black@0.25(可調), w=1/2螢幕, h=1/4螢幕, pos(0,0)
    //   => 輸出 label: [preOut]
    let baseFilter = [
      'format=rgb24',

      // 紅黑化
      `colorchannelmixer=1.2:0.2:0.2:0:0:0:0:0:0:0:0:0:0:0:0:1`,
      `curves=r='0/0 0.5/0.3 1/1':g='0/0 0.5/0.3 1/1':b='0/0 0.5/0.3 1/1'`,

      // 雜訊 (c0=亮度通道)
      `noise=c0s=30:c0f=t+u`,

      // 每隔5秒顯示1秒，左上方(0,0) 半透明黑框 (約畫面1/2寬 x 1/4高)
      `drawbox=x=0:y=0:w='iw/2':h='ih/4':color=black@0.25:enable='lt(mod(t,5),1)'`
    ].join(',');

    filters.push(`[0:v]${baseFilter}[preOut]`);

    // Step2: 可選 => 子像素偏移
    //   label: [subShiftOut] or [preOut]
    let labelA = 'preOut';
    if (useSubPixelShift) {
      filters.push(`
        [preOut]split=2[sub1][sub2];
        [sub1]pad=iw+1:ih:1:0:black[pA];
        [sub2]pad=iw+1:ih:0:0:black[pB];
        [pA][pB]blend=all_expr='if(eq(mod(N,2),0),A,B)'[subShiftOut]
      `);
      labelA = 'subShiftOut';
    }

    // Step3: 可選 => 使用者原先 useMaskOverlay => 在畫面中央疊加紅色方塊
    //   label => [maskedOut]
    let labelB = labelA;
    if (useMaskOverlay) {
      filters.push(`
        color=size=16x16:color=red@${maskOpacity}[maskSrc];
        [${labelA}]scale=trunc(iw/2)*2:trunc(ih/2)*2[baseScaled];
        [maskSrc]scale=iw*${maskSizeRatio}:ih*${maskSizeRatio}[maskBig];
        [baseScaled][maskBig]
        overlay=x='(W-w)/2':y='(H-h)/2':
                enable='lt(mod(N,${maskFreq}),1)'[maskedOut]
      `);
      labelB = 'maskedOut';
    }

    // Step4: 可選 => RGB 分離
    //   label => [rgbSplitOut] or labelB
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
        [rout][gout][bout]interleave=0,format=yuv444p[rgbSplitOut]
      `);
      finalLabel = 'rgbSplitOut';
    }

    // Step5: fps=120 + yuv420p => [finalOut]
    filters.push(`
      [${finalLabel}]fps=120,format=yuv420p[finalOut]
    `);

    // 組合 filter_complex
    const filterComplex = filters
      .map((line) => line.trim())
      .join('; ');

    // ------------------------------------------------------------------
    // (C) 執行 FFmpeg => 輸出 120fps, libx264, yuv420p
    // ------------------------------------------------------------------
    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,
      '-filter_complex', filterComplex,
      '-map', '[finalOut]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-r', '120',               // 再度明示 120fps
      '-pix_fmt', 'yuv420p',
      outputPath
    ];

    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    ff.on('error', (err) => reject(err));
    ff.on('close', (code) => {
      // 清除 AI 暫存檔
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
