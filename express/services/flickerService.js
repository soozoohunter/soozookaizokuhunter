// express/services/flickerService.js
// 或 kaiShield/flickerService.js

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncode - 低频干扰 / 无刺眼闪烁 版
 *
 * 实现要点：
 *  1) 可选 AI 扰动 (useAiPerturb)
 *  2) FFmpeg 多输入：视频 + 扫描线图 (scanline.png)
 *  3) 一次性滤镜链：
 *     - 周期性局部遮罩：drawbox=enable='lt(mod(t,5),1)'
 *       (每 5 秒中前 1 秒，叠加半透明黑色矩形)
 *     - noise=c0s=20:c0f=t+u (给亮度添加随机噪声)
 *     - 与扫描线图做 softlight 混合 blend=all_opacity=0.15
 *     - transform：随时间轻度平滑移动 x,y => 避免强闪烁
 *     - fps=30 + yuv420p 输出 (可改为 60/120)
 *
 * 优势：对人眼仅微扰，但对录屏器可能出现局部黑框闪现、条纹抖动。
 */

async function flickerEncode(
  inputPath,
  outputPath,
  {
    // 是否先调用 aiPerturb
    useAiPerturb = false,

    // 目标帧率 (默认 30，可自行改 60 或更高)
    outFps = 30,

    // 扫描线图名称
    scanlineImage = 'scanline.png',

    // 周期性遮罩参数
    // 每 5秒 有 1秒 看到半透明黑框
    maskOpacity = 0.25,      // 遮罩不透明度
    maskPeriod = 5,          // 周期 (秒)
    maskShowSec = 1,         // 周期内的显示时长 (秒)

    // 噪点强度(0~100 越大越明显)
    noiseStrength = 20,

  } = {}
) {
  return new Promise((resolve, reject) => {

    // ============== (A) 可选：AI 扰动 ==============
    let encodeInput = inputPath;
    let aiTempPath = '';

    if (useAiPerturb) {
      try {
        aiTempPath = path.join(path.dirname(outputPath), 'tmpAi_' + Date.now() + '.mp4');
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, { stdio: 'inherit' });
        encodeInput = aiTempPath;
      } catch (err) {
        console.error('[AI Perturb error]', err);
      }
    }

    // ============== (B) FFmpeg - 多输入 ==============
    //  1) -i encodeInput (主视频)
    //  2) -i scanline.png (扫描线图)
    // 注意：需确保有 scanline.png 存在

    // 构建 filter_complex
    // 主要思路：
    //   [0:v] -> drawbox(周期性黑框) -> noise -> label=baseVid
    //   [baseVid][1:v] -> blend=softlight -> label=blended
    //   blended -> transform=x=...,y=... -> fps=...,format=... -> finalOut
    //
    // 1. drawbox:
    //    enable='lt(mod(t,maskPeriod),maskShowSec)'
    //    color=black@maskOpacity :t=fill (覆盖一个较大的矩形)
    //    x=0,y=0,w=iw,h=ih => 整个画面
    //
    // 2. noise=c0s=noiseStrength:c0f=t+u => 仅作用于亮度通道, 并time+uniform
    // 3. blend=all_mode=softlight:all_opacity=0.15 => 与 scanline 叠加
    // 4. transform => 利用时间表达式(例如 x=10*sin(t/3), y=10*cos(t/4))
    //                 不会出现高频闪, 而是平滑随时间移动
    // 5. fps=outFps,format=yuv420p

    const overlayDrawbox = `drawbox=x=0:y=0:w=iw:h=ih:color=black@${maskOpacity}:t=fill:enable='lt(mod(t,${maskPeriod}),${maskShowSec})'`;
    const noiseFilter = `noise=c0s=${noiseStrength}:c0f=t+u`;
    // softlight 扫描线
    const softlightBlend = `blend=all_mode=softlight:all_opacity=0.15`;
    // transform => 周期性小幅移动 例如 幅度10px
    // x=10*sin(t/3) y=10*cos(t/4)
    // (可自行改幅度/周期)
    const transformExp = `transform=x='10*sin(T/3)':y='10*cos(T/4)':fillcolor=black`;

    // 注意：FFmpeg expression 里 t -> pts (秒)? 这里写 T => 需 alias
    // ffmpeg 里 time 可用 't'  => transform=...
    // 记得把 T 改成 t
    const transformFilter = transformExp.replace(/T/g, 't');

    // 拼接 filter_complex
    const fc = [
      // 先处理主视频
      `[0:v]${overlayDrawbox},${noiseFilter}[baseVid]`,
      // 与扫描线图做 softlight
      `[baseVid][1:v]${softlightBlend}[blended]`,
      // transform => fps => format => [final]
      `[blended]${transformFilter},fps=${outFps},format=yuv420p[finalOut]`
    ].join('; ');

    // ============== (C) 执行 FFmpeg ==============
    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,           // 主视频
      '-i', scanlineImage,         // 扫描线图
      '-filter_complex', fc,
      '-map', '[finalOut]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-pix_fmt', 'yuv420p',
      '-r', String(outFps),        // 再声明输出帧率
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
        reject(new Error(`FFmpeg process error, code=${code}`));
      }
    });
  });
}

module.exports = { flickerEncode };
