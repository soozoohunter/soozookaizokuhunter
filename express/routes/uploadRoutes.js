// express/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
// 需注意檔名 planMiddleware.js
const planMiddleware = require('../middleware/planMiddleware');
const uploadController = require('../controllers/uploadController');

// Multer - 暫存目錄
const upload = multer({ dest: 'uploads/' });

// POST /api/upload
router.post(
  '/',
  authMiddleware,
  planMiddleware('upload'),  // 執行方案檢查
  upload.single('file'),
  uploadController.uploadFile
);

module.exports = router;
