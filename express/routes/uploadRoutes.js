// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const planMiddleware = require('../middleware/planMiddleware');
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
