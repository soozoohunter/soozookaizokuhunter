// kaiShield/api_service/server.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
app.use(express.json());

// 設定 uploads 資料夾 (跟 Docker volume 對應)
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Multer 設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

// 上傳檔案 => 執行對抗擾動 => 轉影片+閃爍 => 回傳
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: '請上傳檔案' });
    }

    const file = req.file; // { path, filename, etc. }
    console.log(`[INFO] file uploaded: ${file.filename}`);

    // 1) 呼叫 Python AI microservice
    const aiServiceUrl = 'http://ai_service:5000/perturb';
    const perturbResp = await axios.post(aiServiceUrl, {
      filename: file.filename
    });

    if (perturbResp.data.status !== 'success') {
      return res.status(500).json({ error: 'AI perturbation failed' });
    }

    const processedFilename = perturbResp.data.processedFilename;
    const processedFilePath = path.join(uploadFolder, processedFilename);

    // 2) 用 FFmpeg 做閃爍 / 黑幀
    // 假設我們要輸出到 ../media_output 共享資料夾
    const outputFolder = path.join(__dirname, '..', 'media_output');
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const outputFilename = Date.now() + '_protected.mp4';
    const outputPath = path.join(outputFolder, outputFilename);

    // 假設我們要做的效果是：若是靜態圖片 => 5 秒 + 每隔 5 幀插黑
    // (可依需求客製)
    ffmpeg(processedFilePath)
      // 若為圖片 => -loop 1 -t 5
      .inputOptions(['-loop 1'])
      .outputOptions(['-t 5', '-r 30'])
      .complexFilter([
        // 產生 5 秒黑畫面
        '[0:v]setpts=PTS-STARTPTS[base];' +
        'color=c=black@1.0:size=1920x1080:rate=30:d=5[black];' +
        '[base][black]blend=all_expr=\'if(eq(mod(N,5),0),B,A)\'[outv]'
      ], 'outv')
      .map('[outv]')
      .on('error', (err) => {
        console.error('[FFmpeg error]', err);
        return res.status(500).json({ error: 'FFmpeg error', detail: err.message });
      })
      .on('end', () => {
        console.log(`[INFO] Protected file => ${outputPath}`);
        return res.json({
          message: 'File processed & protected successfully',
          output: outputFilename
        });
      })
      .save(outputPath);

  } catch (err) {
    console.error('[Upload Route Error]', err);
    return res.status(500).json({ error: 'Internal Error', detail: err.message });
  }
});

app.listen(3000, () => {
  console.log('Node.js API Service running on port 3000');
});
