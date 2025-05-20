// api_service/server.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');

// ★ 調整路徑 ⇒ 引入同目錄下的 flickerService.js
const { flickerEncode } = require('./flickerService');

const app = express();
app.use(express.json());

// ─── 上傳設定 ────────────────────────────────────────
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename:    (req, file, cb) => {
    // 保留原始副檔名
    const ext = path.extname(file.originalname);
    const basename = Date.now().toString();
    cb(null, basename + ext);
  }
});
const upload = multer({ storage });

// ─── 上傳並產生防側錄影片 ─────────────────────────────
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: '請上傳檔案' });
    }
    console.log(`[INFO] file uploaded: ${req.file.filename}`);

    // 建立輸出資料夾
    const outputFolder = path.join(__dirname, 'media_output');
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const outputFilename = Date.now() + '_protected.mp4';
    const outputPath = path.join(outputFolder, outputFilename);

    // 呼叫 flickerEncode
    await flickerEncode(req.file.path, outputPath, {
      doMask: true,
      doAiPerturb: true,
      doRgbSplit: false
    });

    return res.json({
      message: 'File processed & protected successfully',
      output: outputFilename
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

// ─── 啟動 ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Service running on port ${PORT}`);
});
