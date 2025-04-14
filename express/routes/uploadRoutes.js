// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const planMiddleware = require('../middleware/planMiddleware');
const UploadController = require('../controllers/uploadController');

// 設定 Multer：使用記憶體儲存，不保留原始檔案
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制檔案大小，例如 10MB
  fileFilter: (req, file, cb) => {
    // 僅接受圖片或影片檔案 MIME 型別
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      return cb(new Error('不支援的檔案類型'), false);
    }
    cb(null, true);
  }
});

// POST /api/upload - 上傳圖片或影片
// 依序通過：JWT 驗證 -> 方案上傳限額檢查 -> Multer 上傳處理 -> 控制器處理
router.post('/', 
  authMiddleware, 
  planMiddleware('upload'), 
  upload.single('file'), 
  UploadController.uploadFile
);

module.exports = router;
