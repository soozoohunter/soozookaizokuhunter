// express/routes/mySearchRoute.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { launchGoogleReverse } = require('../services/reverseImageSearch'); 
// ↑ 這是您自己封裝的函式，把 googleReverseImage.js 的主要邏輯包起來

// 上傳暫存
const upload = multer({ dest: 'uploads/' });

router.post('/reverse-image-search', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '缺少檔案' });
    }
    // localPath => e.g. uploads/xxxx.jpg
    const localPath = req.file.path;

    // 調用 Puppeteer => 取得搜尋結果
    const links = await launchGoogleReverse(localPath);

    return res.json({ results: links });
  } catch (err) {
    console.error('[reverse-image-search Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
