// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');

// 驗證 JWT
const authMiddleware = require('../middleware/authMiddleware');

// 檢查用戶 Plan (方案限制)
const planMiddleware = require('../middleware/planMiddleware');

// 上傳檔案邏輯
const uploadController = require('../controllers/uploadController');

// 設定 Multer：使用本地暫存 (uploads/)
const upload = multer({ dest: 'uploads/' });

// POST /api/upload
router.post(
  '/',
  authMiddleware,
  planMiddleware('upload'),
  upload.single('file'),
  uploadController.uploadFile
);

module.exports = router;
