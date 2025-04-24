// express/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const planMiddleware = require('../middleware/planMiddleware');
const uploadController = require('../controllers/uploadController');

// 使用本地暫存
const upload = multer({ dest: 'uploads/' });

// POST /api/upload
router.post(
  '/',
  authMiddleware,            // 檢查 JWT
  planMiddleware('upload'),  // 檢查上傳次數是否超量
  upload.single('file'),     // 單檔
  uploadController.uploadFile
);

module.exports = router;
