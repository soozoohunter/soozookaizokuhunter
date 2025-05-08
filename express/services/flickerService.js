//---------------------------------------------
// 改良增強版 flickerEncode：整合多層次擾動
// --------------------------------------------
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * flickerEncodeAdvanced - 多層次的「純軟體防側錄」FFmpeg 濾鏡範例
 * 
 * @param {string} inputPath   - 輸入檔(影片或已轉成影片的圖檔)
 * @param {string} outputPath  - 輸出防錄製檔(.mp4)
 * @param {object} options     - 干擾參數
 * 
 * 主要可調的開關：
 *    useSubPixelShift : 是否啟用子像素平移
 *    useMaskOverlay   : 是否在畫面中央疊加半透明遮罩
 *    maskOpacity      : 遮罩透明度
 *    maskFreq         : 遮罩的出現頻率(每 N 幀出現 1 幀 or 每 N 秒出現 1 秒)
 *    maskSizeRatio    : 遮罩大小(相對整個畫面)
 *    useRgbSplit      : 是否啟用 RGB 三通道錯位
 *    useAiPerturb     : 是否執行 AI 對抗擾動(需另外撰寫 python 腳本)
 *    flickerFps       : 輸出的幀率(建議 60 或 120; 預設 120)
 *    noiseStrength    : 雜訊強度(0~100) / 預設 30
 *    colorCurveDark   : 適度壓暗的曲線參數
 *    colorCurveLight  : 適度提升亮部的曲線參數
 *    drawBoxSeconds   : 幾秒內顯示方塊(例如 5 表示每 5 秒顯示 1 秒)
 */
async function flickerEncodeAdvanced(
  inputPath,
  outputPath,
  {
    useSubPixelShift = true,       // 預設開啟子像素平移
    useMaskOverlay   = true,
    maskOpacity      = 0.3,
    maskFreq         = 5,
    maskSizeRatio    = 0.3,
    useRgbSplit      = true,
    useAiPerturb     = false,
    flickerFps       = 120,        // 輸出幀率
    noiseStrength    = 30,         // 雜訊強度
    colorCurveDark   = '0/0 0.5/0.2 1/1',
    colorCurveLight  = '0/0 0.5/0.4 1/1',
    drawBoxSeconds   = 5
  } = {}
) {
  return new Promise((resolve, reject) => {
    // (A) 若想做「AI 對抗擾動」: 先呼叫 python 腳本 (可用 PyTorch/OpenCV)
    let encodeInput = inputPath;
    let aiTempPath  = '';

    if (useAiPerturb) {
      try {
        aiTempPath = path.join(
          path.dirname(outputPath),
          'tmpAi_' + Date.now() + '.mp4'
        );
        // 需你自行實作 aiPerturb.py => 例如: python aiPerturb.py in.mp4 out.mp4
        execSync(`python aiPerturb.py "${encodeInput}" "${aiTempPath}"`, {
          stdio: 'inherit',
        });
        encodeInput = aiTempPath; // 用 AI 處理後的檔再進行 FFmpeg
      } catch (errPy) {
        console.error('[AI Perturb Error]', errPy);
        // 若失敗則不中斷, 直接用原始 inputPath
        encodeInput = inputPath;
      }
    }

    // (B) 濾鏡鏈：先把視訊轉成RGB24 => 再做「曲線壓暗+亮部」+ 雜訊 + drawbox => (可選subPixelShift) => (可選maskOverlay) => (可選rgbSplit) => fps=120, yuv420p
    // ------------------------------------------------------------------------
    // step1: colorchannelmixer + curves => 加強紅色 + 壓暗/亮部
    //        noise=c0s=NN => 在亮度通道添加動態雜訊
    //        drawbox => 低頻地在左上or右上顯示半透明方塊
    const step1Filter = [
      `format=rgb24`,
      // 加強紅色通道(約 1.2)
      `colorchannelmixer=1.2:0.2:0.2:0:0:0:0:0:0:0:0:0:0:0:0:1`,
      // curves => 曲線壓暗 & 亮部
      `curves=r='${colorCurveDark}':g='${colorCurveDark}':b='${colorCurveLight}'`,
      // 雜訊 => 亮度通道 c0s=${noiseStrength}, c0f=t+u => time+uniform
      `noise=c0s=${noiseStrength}:c0f=t+u`,
      // drawbox => 每 ${drawBoxSeconds}秒 顯示 1 秒的半透明黑塊
      `drawbox=x=0:y=0:w='iw/2':h='ih/4':color=black@0.2:enable='lt(mod(t,${drawBoxSeconds}),1)'`
    ].join(',');

    // 組合成 label => [preOut]
    const filters = [`[0:v]${step1Filter}[preOut]`];

    // step2: 可選 => 子像素平移 => [subShiftOut]
    let labelA = 'preOut';  // 目前輸出 label
    if (useSubPixelShift) {
      filters.push(`
        [preOut]split=2[subA][subB];
        [subA]pad=iw+1:ih:1:0:black[sA];
        [subB]pad=iw+1:ih:0:0:black[sB];
        [sA][sB]blend=all_expr='if(eq(mod(N,2),0),A,B)'[subShiftOut]
      `);
      labelA = 'subShiftOut';
    }

    // step3: 可選 => maskOverlay(中央半透明方塊, 每 N 幀或每 N 秒顯示一下)
    let labelB = labelA;
    if (useMaskOverlay) {
      filters.push(`
        color=size=16x16:color=red@${maskOpacity}[maskSrc];
        [${labelA}]scale=trunc(iw/2)*2:trunc(ih/2)*2[baseScaled];
        [maskSrc]scale=iw*${maskSizeRatio}:ih*${maskSizeRatio}[maskBig];
        [baseScaled][maskBig]
        overlay=x='(W-w)/2':y='(H-h)/2'
                :enable='lt(mod(N,${maskFreq}),1)'
        [maskedOut]
      `);
      labelB = 'maskedOut';
    }

    // step4: 可選 => RGB split => [rgbSplitOut]
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
        [rout][gout][bout]interleave=0,format=rgb24[rgbSplitOut]
      `);
      finalLabel = 'rgbSplitOut';
    }

    // step5: fps=xxx + yuv420p => [finalOut]
    // 請注意：若你想要保留原聲音，可再 -map 0:a? -c:a aac 之類的做法
    filters.push(`
      [${finalLabel}]fps=${flickerFps},format=yuv420p[finalOut]
    `);

    const filterComplex = filters.map(x => x.trim()).join(';');

    // (C) ffmpeg 參數
    const ffmpegArgs = [
      '-y',
      '-i', encodeInput,
      '-filter_complex', filterComplex,
      // 若要保留音訊 => 你可以多寫: '-map', '0:v:0', '-map', '0:a?:0' ...
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
      // 清除 AI 暫存檔
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

// -----------------------------------------------------------
// 範例：在 router.post('/flickerProtectFile', ...) 中使用
// （請將此示範整合到你既有的 protect.js 即可）
// -----------------------------------------------------------
router.post('/flickerProtectFile', async (req, res) => {
  try {
    const { fileId } = req.body;
    if(!fileId) {
      return res.status(400).json({ error: 'MISSING_FILE_ID', message:'請提供 fileId' });
    }

    // 1) 找 DB
    const fileRec = await File.findByPk(fileId);
    if(!fileRec) {
      return res.status(404).json({ error:'FILE_NOT_FOUND', message:'無此 File ID' });
    }

    // 2) 檔案是否存在
    const ext= path.extname(fileRec.filename)||'';
    const localPath= path.join(UPLOAD_BASE_DIR, `imageForSearch_${fileRec.id}${ext}`);
    if(!fs.existsSync(localPath)){
      return res.status(404).json({ error:'LOCAL_FILE_NOT_FOUND', message:'原始檔不在本機，無法做防側錄' });
    }

    // 3) 若是圖片 => 先轉成短 mp4 (5 秒)，再做 flickerEncodeAdvanced
    const isImage = !!fileRec.filename.match(/\.(jpe?g|png|gif|bmp|webp)$/i);
    let sourcePath = localPath;

    if (isImage) {
      const tempPath = path.join(UPLOAD_BASE_DIR, `tempIMG_${Date.now()}.mp4`);
      try {
        // 轉成 5秒的靜態影片
        const cmd = `ffmpeg -y -loop 1 -i "${localPath}" -t 5 -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${tempPath}"`;
        console.log('[flickerProtectFile] convert image to 5s mp4 =>', cmd);
        execSync(cmd);
        sourcePath = tempPath;
      } catch(eImg){
        console.error('[flickerProtectFile] convert img->video error =>', eImg);
        return res.status(500).json({ error:'IMG_TO_VIDEO_ERROR', detail:eImg.message });
      }
    }

    // 4) 呼叫 flickerEncodeAdvanced
    const protectedName = `flicker_protected_${fileRec.id}_${Date.now()}.mp4`;
    const protectedPath = path.join(UPLOAD_BASE_DIR, protectedName);

    await flickerEncodeAdvanced(sourcePath, protectedPath, {
      useSubPixelShift : true,
      useMaskOverlay   : true,
      maskOpacity      : 0.25,
      maskFreq         : 5,
      maskSizeRatio    : 0.3,
      useRgbSplit      : true,
      useAiPerturb     : false,    // 若要開啟 AI 對抗擾動 => 設 true
      flickerFps       : 120,
      noiseStrength    : 25,
      colorCurveDark   : '0/0 0.5/0.2 1/1',
      colorCurveLight  : '0/0 0.5/0.4 1/1',
      drawBoxSeconds   : 5
    });

    // 若中間有 tempIMG => 刪除
    if (isImage && sourcePath !== localPath && fs.existsSync(sourcePath)) {
      fs.unlinkSync(sourcePath);
    }

    // 5) 回傳可下載連結
    const protectedFileUrl = `/api/protect/flickerDownload?file=${encodeURIComponent(protectedName)}`;
    return res.json({
      message:'已成功產生多層次防錄製檔案 (Advanced)',
      protectedFileUrl
    });

  } catch(e){
    console.error('[POST /flickerProtectFile] error =>', e);
    return res.status(500).json({ error:'INTERNAL_ERROR', detail:e.message });
  }
});

// -----------------------------------------------------------
// 保持原本的下載路由不變即可
// -----------------------------------------------------------
router.get('/flickerDownload', (req, res)=>{
  try {
    const file = req.query.file;
    if(!file){
      return res.status(400).send('Missing ?file=');
    }
    const filePath = path.join(UPLOAD_BASE_DIR, file);
    if(!fs.existsSync(filePath)){
      return res.status(404).send('File not found');
    }
    return res.download(filePath, `KaiShield_Flicker_${file}`);
  } catch(e){
    console.error('[flickerDownload error]', e);
    return res.status(500).send('Download error: ' + e.message);
  }
});
