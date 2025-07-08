// express/routes/uploadRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const planMiddleware = require('../middleware/planMiddleware');
const uploadController = require('../controllers/uploadController');

// 1) 使用本地暫存: multer 會先將檔案存到 "uploads/" (相對 or 絕對?)
//   - 您原本的設定保留
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/upload
 * - 先做 authMiddleware, planMiddleware
 * - 再單檔上傳
 * - 再 rename => 避免領頭 "/"，確保 "uploads" 資料夾可用
 * - 最後呼叫原本的 uploadController.uploadFile
 */
router.post(
  '/',
  authMiddleware,
  planMiddleware('upload'),
  upload.single('file'),
  (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // 舉例：依照原檔名決定副檔名
      const ext = path.extname(req.file.originalname) || '';
      // 生成一個新檔名 => "upload_1685630470123.jpg"
      const newFileName = `upload_${Date.now()}${ext}`;

      // 2) 準備要移動的「最終目錄」： 例如 /app/uploads (Docker 內)
      //    假設此檔案位於: express/routes/uploadRoutes.js
      //    跳兩層回到專案根，再進到 uploads/
      //    => /app/uploads
      const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // 3) 做 rename
      const sourcePath = req.file.path; // e.g. "uploads/abc123"
      const targetPath = path.join(uploadsDir, newFileName);
      fs.renameSync(sourcePath, targetPath);

      // 4) 可將 newPath 註冊到 req.file，讓後續 uploadController 用
      req.file.newPath = targetPath;
      req.file.newFilename = newFileName;

      // 繼續
      next();
    } catch (err) {
      console.error('[uploadRoutes rename error]', err);
      return res.status(500).json({
        error: `Rename file failed: ${err.message}`
      });
    }
  },
  uploadController.uploadFile
);

module.exports = router;
