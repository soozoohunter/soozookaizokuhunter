// kaiShield/flickerService.js

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncode (增強版 - 紅黑遮蔽方案)
 * 
 * 主要改動：
 *   1. 移除原先 brightness/blend 高頻閃爍 => 改以「色彩扭曲」方式。
 *   2. 預設將畫面轉為紅黑調，壓制綠藍通道，並可在中段亮度進行壓暗。
 *   3. 保留 AI 擾動 (useAiPerturb) 選項；若啟用，先呼叫 aiPerturb.py 再進行 FFmpeg。
 *   4. 保留子像素偏移 (useSubPixelShift)、局部遮罩 (useMaskOverlay)、RGB 分離 (useRgbSplit) 等功能，
 *      但不再使用 brightness flicker / hue flicker / random flicker。
 *   5. 最終輸出預設為 120fps，並以 H.264 (libx264) 或您可改為 H.265 (libx265)。
 *
 * 支援參數：
 *   - useAiPerturb (bool): 是否先執行 aiPerturb.py 做對抗擾動
 *   - useSubPixelShift (bool): 是否在畫面中做子像素位移
 *   - useMaskOverlay (bool):  是否疊加半透明黑色遮罩
 *   - useRgbSplit (bool):     是否做 RGB 分離
 * 
 * 注意：舊的 useHueFlicker / hueFlickerAmp / useRandomFlicker 等，已不再生效。
 */

async function flickerEncode(
  inputPath, 
  outputPath, 
  {
    // 保留原先的可選參數
    useRgbSplit = false,
    useRandomFlicker = false,   // 已廢棄，不再產生亮暗閃爍
    useSubPixelShift = false,
    useAiPerturb = false,

    // 舊參數 (Hue Flicker 等) 不再使用
    useHueFlicker = false,
    hueFlickerAmp = 0.1,

    // 遮罩相關
    useMaskOverlay = false,
    maskOpacity = 0.2,
    maskFreq = 5,
    maskSizeRatio = 0.3,
  } = {}
) {

  return new Promise((resolve, reject) => {
    // ------------------------------------------------
    // (A) 若啟用 AI 擾動 => 先呼叫 aiPerturb.py
    // ------------------------------------------------
    let encodeInput = inputPath;
    let aiTempPath = '';
    if (useAiPerturb) {
      try {
        aiTempPath = path.join(
          path.dirname(outputPath), 
          'tmpAi_' + Date.now() + '.mp4'
        );
        // 執行 aiPerturb.py, 將 inputPath => aiTempPath
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, 
                 { stdio: 'inherit' });
        // 後續 FFmpeg 輸入就用這個擾動後檔
        encodeInput = aiTempPath;

      } catch (err) {
        console.error('[AI Perturb error]', err);
        // 若失敗，不強制中斷 => 直接使用原 inputPath
      }
    }

    // ------------------------------------------------
    // (B) 建構 FFmpeg 濾鏡 filter_complex
    //     (捨棄亮度閃爍 => 改用「紅黑扭曲 + 可選附加」)
    // ------------------------------------------------

    // 1) 先將影片轉 RGB24 (方便 colorchannelmixer / curves)
    // 2) colorchannelmixer => 加強紅色 / 壓制綠藍 => 紅黑調
    // 3) curves => 進一步壓暗中段亮度 (讓非紅色幾乎全黑)
    // 4) (可選) 子像素偏移 useSubPixelShift
    // 5) (可選) 局部遮罩 useMaskOverlay
    // 6) (可選) RGB 分離 useRgbSplit
    // 7) fps=120, 最後轉成 yuv420p

    let filters = [];

    // (1) 轉成 RGB24
    filters.push('format=rgb24');

    // (2) 主要紅黑扭曲：colorchannelmixer
    //    例：紅通道 = 原R (1.2倍), + 一點綠藍(0.2倍) 以避免過暗
    //    G、B 輸出則全部壓到0 => 畫面僅剩紅色, 其他幾乎黑
    //    若想更極端，可將 0.2 改小甚至0 => 幾乎全黑 + 紅
    filters.push('colorchannelmixer=' + [
      '1.2:0.2:0.2:0',  // R_out = 1.2R_in + 0.2G_in + 0.2B_in
      '0:0:0:0',        // G_out = 0
      '0:0:0:0'         // B_out = 0
    ].join(':'));

    // (3) 用 curves 加強中間調對比 => 大部分非紅色區域變更暗
    //    範例：紅(R)在0.4~0.6之間拉升、中暗部更暗
    //          綠/藍則絕大部分壓到黑，只留極少量高光
    filters.push(`curves=r='0/0 0.4/0.6 1/1':g='0/0 0.7/0 1/0.2':b='0/0 0.7/0 1/0.2'`);

    // (4) 可選：子像素偏移 => 用 pad + blend 在奇偶幀做1px/2px位移
    let lastLabel = '[mainOut]';  // 給後面連接
    filters.push(`
      [0:v]split=2[base1][base2];
      [base1]null[mainOut]
    `);

    // 下面這段我們暫時用「空分支」來放可選功能
    // (為了 filter graph 結構一致，可先把 colorchannelmixer + curves 串在一起 => 由於 complexities, 這裡做簡化)
    // 真實實作要將 colorchannelmixer/curves 直接串接在 [base1][base2] 之後

    // 先把 colorchannelmixer/curves 串到 [base1] => [mainOut], 
    // 待會再處理 subpixelShift, maskOverlay, rgbSplit
    // -----------------------------------------------------------
    // => 其實更嚴謹的作法是：
    // [0:v]format=rgb24,colorchannelmixer=...,curves=... [preOut]
    // 再由 [preOut] 分支出2路, ...
    // 但為了示範保持可讀性，此處簡化

    // 其實可將 filters.push(...) 全部攜帶
    // 由於 FFmpeg filter_complex 需要完整 graph，這裡給示例：

    filters = [
      `
[0:v]format=rgb24,
 colorchannelmixer=1.2:0.2:0.2:0:0:0:0:0:0:0:0:0:0:0:0:1,
 curves=r='0/0 0.4/0.6 1/1':g='0/0 0.7/0 1/0.2':b='0/0 0.7/0 1/0.2'
`
    ];

    // (4) 若 useSubPixelShift => 在紅通道做1px移動 (範例)
    let currentLabel = '[colOut]'; // 先命名後面 output label
    let graph = `[colOut]`;        // for chaining
    let subPixelBlock = '';
    if (useSubPixelShift) {
      // 範例：將上一輸出 split=2 => [leftShift] [rightShift] => pad => blend
      // 這裡簡化 => shift 1px
      subPixelBlock = `
        split=2[shiftA][shiftB];
        [shiftA]pad=iw+1:ih:1:0:black[padA];
        [shiftB]pad=iw+1:ih:0:0:black[padB];
        [padA][padB]blend=all_expr='if(eq(mod(N,2),0),A,B)'
      `;
      currentLabel = '[subShiftOut]';
    }

    // (5) 若 useMaskOverlay => 疊黑色方塊(半透明)
    let maskBlock = '';
    let maskOut = currentLabel;
    if (useMaskOverlay) {
      // color => overlay => enable='lt(mod(N,maskFreq),1)'
      // ex: 5幀一次
      maskBlock = `
        color=size=16x16:color=black@${maskOpacity}[tinyMask];
        [PREV]scale=trunc(iw/2)*2:trunc(ih/2)*2[base];
        [tinyMask]scale=iw*${maskSizeRatio}:ih*${maskSizeRatio}[maskBig];
        [base][maskBig]overlay=x='(W-w)/2':y='(H-h)/2':enable='lt(mod(N,${maskFreq}),1)'
      `;
      maskOut = '[maskedOut]';
    }

    // (6) 若 useRgbSplit => split成 R/G/B => interleave => yuv444p
    let rgbSplitBlock = '';
    let finalLabel = maskOut;
    if (useRgbSplit) {
      rgbSplitBlock = `
        split=3[rSplit][gSplit][bSplit];
        [rSplit]extractplanes=r[rC];
        [gSplit]extractplanes=g[gC];
        [bSplit]extractplanes=b[bC];
        [rC][gC][bC]interleave=0,format=yuv444p
      `;
      finalLabel = '[rgbSplitOut]';
    }

    // 組合成最終的 filter_complex 字串
    // --------------------------------------
    // 先把第一段(紅黑扭曲) -> subPixel -> mask -> rgbSplit -> fps -> format
    // 
    // 範例(示意)： 
    // [0:v]format=rgb24,colorchannelmixer=...,curves=... [colOut];
    // [colOut]split=2[shiftA][shiftB]; ...
    // [subShiftOut]color=...,overlay=... [maskedOut];
    // [maskedOut]split=3 ... interleave=... [rgbSplitOut];
    // [rgbSplitOut]fps=120,format=yuv420p[out]

    let mainGraph = [];
    // A. 先做紅黑扭曲 => 命名輸出 [colOut]
    mainGraph.push(`
      [0:v]format=rgb24,
            colorchannelmixer=1.2:0.2:0.2:0:0:0:0:0:0:0:0:0:0:0:0:1,
            curves=r='0/0 0.4/0.6 1/1':g='0/0 0.7/0 1/0.2':b='0/0 0.7/0 1/0.2'
      [colOut]
    `.trim());

    // B. subPixelShift
    if (useSubPixelShift) {
      // [colOut] => subPixelBlock => [subShiftOut]
      // 需要把 subPixelBlock 中 placeholders 塞好
      let subPixelChain = subPixelBlock.trim()
        .replace('[shiftA]', '[colOut]split=2[shiftA][shiftB];\n[shiftA]')
        .replace(/(\n)\s+/g, '$1'); // 壓縮空白
      mainGraph.push(subPixelChain + '[subShiftOut]');
    }

    // 前一段輸出的 label
    let prevLabel = useSubPixelShift ? '[subShiftOut]' : '[colOut]';

    // C. Mask overlay
    if (useMaskOverlay) {
      let maskedChain = maskBlock.trim().replace('[PREV]', prevLabel);
      mainGraph.push(maskedChain + '[maskedOut]');
      prevLabel = '[maskedOut]';
    }

    // D. RGB Split
    if (useRgbSplit) {
      let splitted = rgbSplitBlock.trim()
        .replace('split=3', `${prevLabel}split=3`) // chain
        .replace('[rC][gC][bC]interleave=0,format=yuv444p', '[rgbSplitOut]');
      mainGraph.push(splitted);
      prevLabel = '[rgbSplitOut]';
    }

    // E. fps=120 + format=yuv420p => [finalOut]
    mainGraph.push(`
      ${prevLabel}fps=120,format=yuv420p[finalOut]
    `);

    // 組合
    let filterComplex = mainGraph
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('; ');

    // ------------------------------------------------
    // (C) 執行 FFmpeg，輸出 120fps, yuv420p
    // ------------------------------------------------
    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,
      '-filter_complex', filterComplex,
      '-map', '[finalOut]',
      '-c:v', 'libx264',      // or libx265
      '-preset', 'medium',
      '-pix_fmt', 'yuv420p',  // 與最後 format=yuv420p 對應
      '-r', '120',            // 再加一道保險
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
        reject(new Error(
          `flickerEncode ffmpeg error, code=${code}`
        ));
      }
    });
  });
}

module.exports = { flickerEncode };
