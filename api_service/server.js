// server.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');

// 新增: 引入我們自定義的 flickerEncode
const { flickerEncode } = require('../flickerService');

const app = express();
app.use(express.json());

// ... uploadFolder, storage, multer省略

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: '請上傳檔案' });
    }
    const file = req.file;
    console.log(`[INFO] file uploaded: ${file.filename}`);

    // 1) 呼叫 ai_service => 這裡若原本是 restful, 亦可保留,
    //    但由於我們 flickerEncode 內部也可做 AI擾動, 看您是否要

    // 2) flickerEncode => 產生最終防護影片
    const outputFolder = path.join(__dirname, '..', 'media_output');
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const outputFilename = Date.now() + '_protected.mp4';
    const outputPath = path.join(outputFolder, outputFilename);

    // 輸入檔案 (req.file.path) => output
    // 設定參數: doMask, doAiPerturb, doRgbSplit...
    await flickerEncode(req.file.path, outputPath, {
      doMask: true,
      doAiPerturb: true,
      doRgbSplit: false,
    });

    return res.json({
      message: 'File processed & protected successfully',
      output: outputFilename
    });

  } catch(err) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ error:'Internal Error', detail: err.message });
  }
});

app.listen(3000, ()=> {
  console.log('Node.js API Service running on port 3000');
});
