/*********************************************************************************
 * routes/uploadRoutes.js (Enterprise-Ready)
 *
 * 功能：
 *  1. 接收前端單檔上傳 (Multer => uploads/)
 *  2. 先透過 authMiddleware 驗證 JWT
 *  3. 再透過 planMiddleware('upload') 檢查上傳次數
 *  4. 交由 uploadController.uploadFile
 *********************************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const planMiddleware = require('../middleware/planMiddleware');
const uploadController = require('../controllers/uploadController');

// Multer：使用本地暫存 (uploads/)
const upload = multer({ dest: 'uploads/' });

// POST /api/upload
router.post(
  '/',
  authMiddleware,            // 1) 驗證使用者
  planMiddleware('upload'),  // 2) 檢查方案上傳次數
  upload.single('file'),     // 3) 單檔上傳
  uploadController.uploadFile // 4) 上傳控制器
);

module.exports = router;
