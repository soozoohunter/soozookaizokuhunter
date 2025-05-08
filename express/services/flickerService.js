// kaiShield/flickerService.js

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncode (去除可見閃爍的「穩定紅黑遮蔽」版本)
 *
 * 功能：
 *   1. 紅黑化：colorchannelmixer + curves
 *   2. 子像素偏移 (useSubPixelShift) => "恆定" 偏移，不依奇偶幀交替
 *   3. 遮罩 (useMaskOverlay) => 持續顯示/或固定位置蓋一塊
 *   4. RGB 分離 (useRgbSplit) => 一次性拆分 R/G/B
 *   5. AiPerturb (useAiPerturb) => 先呼叫 aiPerturb.py
 *   6. 輸出 120fps + yuv420p
 *
 * 已「完全移除」任何透過幀序號(奇偶)或 difference/亮度交替之類
 * 可能導致人眼覺得「明暗閃爍」的邏輯。
 */
async function flickerEncode(
  inputPath, 
  outputPath, 
  {
    useAiPerturb     = false,
    useSubPixelShift = false,
    useMaskOverlay   = false,
    useRgbSplit      = false,

    // 以下舊參數保持但不使用
    useRandomFlicker = false,
    useHueFlicker    = false,
    hueFlickerAmp    = 0.1,

    // 遮罩相關
    maskOpacity   = 0.2,
    maskFreq      = 5,         // 不再採每N幀一次 (若需要保留, 建議改成平滑方式)
    maskSizeRatio = 0.3
  } = {}
) {
  return new Promise((resolve, reject) => {

    // ============================================
    // (A) 先執行 AI 擾動 (可選)
    // ============================================
    let encodeInput = inputPath;
    let aiTempPath = '';

    if (useAiPerturb) {
      try {
        aiTempPath = path.join(
          path.dirname(outputPath),
          `tmpAi_${Date.now()}.mp4`
        );
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, {
          stdio: 'inherit'
        });
        encodeInput = aiTempPath;
      } catch (err) {
        console.error('[AI Perturb error]', err);
        // 若失敗則直接用原檔
      }
    }

    // ============================================
    // (B) 建構 FFmpeg filter_complex
    // ============================================
    //
    // 1) format=rgb24
    // 2) colorchannelmixer => 紅色增強 / 綠藍壓低 (達到紅黑化)
    // 3) curves => 進一步壓暗中段亮度
    // 4) (可選) 子像素偏移 => 同方向(固定1px)，不做幀交替
    // 5) (可選) 遮罩 => 持續顯示一塊黑或紅色透明
    // 6) (可選) RGB 分離 => 一次性將畫面拆分 R/G/B 再 interleave
    // 7) fps=120 + format=yuv420p

    let filters = [];

    // Step1: RGB24
    filters.push('format=rgb24');

    // Step2: 紅黑化 => colorchannelmixer
    //   R_out = 1.2*R_in + 0.2*G_in + 0.2*B_in (可自行再調)
    //   G_out = 0
    //   B_out = 0
    filters.push(
      'colorchannelmixer=' +
      '1.2:0.2:0.2:0:' +
      '0:0:0:0:' +
      '0:0:0:0:' +
      '0:0:0:1'
    );

    // Step3: curves => 壓暗中段, 讓非紅色區域更接近黑
    filters.push(
      "curves=r='0/0 0.5/0.3 1/0.9':g='0/0 1/0':b='0/0 1/0'"
    );
    // ↑ 說明： 紅通道在中間(0.5) →0.3, 高光(1)→0.9
    //         綠藍通道壓到0(整條曲線0/0,1/0 => 幾乎全黑)

    // (以下我們將 filter 以逗號串接)
    let filterChain = filters.join(',');

    // 4) 子像素偏移 (可選) => 固定偏移 1px (非奇偶幀切換)
    //   e.g. "transform" + 1px shift
    if (useSubPixelShift) {
      // 這裡示範 ffmpeg 的 "transform" filter or overlay/pad
      // simplest: "translate=1:1"
      // 也可用 "crop=..., pad=..., overlay" => 只要不依幀數就不會閃
      filterChain += ',transform=x=1:y=1:fillcolor=black';
    }

    // 5) 遮罩 (可選)
    if (useMaskOverlay) {
      // 這次不做「每N幀跳一次」，改為「始終覆蓋在某位置」.
      // color => overlay => alpha
      // e.g. overlay at center
      const overlayCmd = [
        `color=size=iwxih:color=black@${maskOpacity}[masksrc]`,  // 全畫面黑膜
        `[masksrc]format=rgba[maskrgba]`,
        `[maskrgba]split=4[mR][mG][mB][mA]`,
        `[0:v][maskrgba]overlay=(W-w)/2:(H-h)/2:format=auto`
      ];
      // 但是這樣會與當前 filterChain 衝突(因為我們已經 "[0:v]..." 了)
      // 簡化作法 => 先把主串接 -> labeled out => overlay
      // 這需要 filter_complex graph. 我們可先組 text then pass to ffmpeg.
      // 為了簡潔，示範直接加: `drawbox` => 全畫面 or partial
      // (drawbox一樣可持續顯示. alpha=0.2 => "color=black@0.2",  fill)

      // 先把 filterChain -> [mainOut], 再 drawbox
      filterChain += ',drawbox=x=0:y=0:w=iw:h=ih:color=black@' + maskOpacity + ':t=fill';
    }

    // 6) RGB 分離 (可選) => 一次性
    if (useRgbSplit) {
      // 需要 yuv444p
      filterChain += ',split=3[r][g][b];' +
        '[r]extractplanes=r[rp];' +
        '[g]extractplanes=g[gp];' +
        '[b]extractplanes=b[bp];' +
        '[rp][gp][bp]interleave=0,format=yuv444p';
      // 注意: 這裡是逗號串接 => 需小心
      // 簡便：把 "split=3"~"format=yuv444p" 用 ";" 分隔 => 會多段.
      // 其實更乾淨的做法是 filter_complex graph, 
      // 但這裡我們只示範 inline
    } else {
      // 不用RGBsplit => 也要補個 ";"
    }

    // 7) fps=120 + format=yuv420p
    filterChain += ',fps=120,format=yuv420p';

    // ============================================
    // (C) 執行 FFmpeg
    // ============================================
    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,
      '-vf', filterChain,    // 改用 -vf (簡化) => 直接套filters
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-pix_fmt', 'yuv420p',
      '-r', '120',           // double check FPS=120
      outputPath
    ];

    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    ff.on('error', (err) => reject(err));
    ff.on('close', (code) => {
      if (aiTempPath && fs.existsSync(aiTempPath)) {
        fs.unlinkSync(aiTempPath);
      }
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`FFmpeg error, code=${code}`));
      }
    });
  });
}

module.exports = { flickerEncode };
