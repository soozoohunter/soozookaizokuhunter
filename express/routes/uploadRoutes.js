/*********************************************************************************
 * routes/uploadRoutes.js (Enterprise-Ready Version)
 *
 * 功能：
 *  1. 接收前端單檔上傳 (Multer => uploads/)
 *  2. 先透過 authMiddleware 驗證 JWT，確認使用者身分
 *  3. 再透過 planMiddleware('upload') 檢查用戶方案上傳上限
 *  4. 交給 uploadController.uploadFile 進行實際檔案處理
 *
 * 使用方式：
 *  POST /api/upload
 *    Content-Type: multipart/form-data
 *    fieldName: "file"
 *
 * 注意事項：
 *  - 您可依需求改變上傳暫存目錄、加上檔案類型過濾
 *  - planMiddleware.js 會檢查 user.uploadVideos / user.uploadImages，請確保 DB 有此欄位
 *********************************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
// 確認檔名為 planMiddleware.js
const planMiddleware = require('../middleware/planMiddleware');
const uploadController = require('../controllers/uploadController');

// 設定 Multer：使用本地暫存 (uploads/)
const upload = multer({ dest: 'uploads/' });

// ================================
// POST /api/upload
// ================================
router.post(
  '/',
  authMiddleware,            // 1) 驗證使用者 JWT
  planMiddleware('upload'),  // 2) 檢查方案上傳次數
  upload.single('file'),     // 3) 處理單檔上傳
  uploadController.uploadFile // 4) 進行實際上傳邏輯 (controller)
);

module.exports = router;
