/*********************************************************************************
 * routes/uploadRoutes.js (Enterprise-Ready Version)
 *
 * 功能：
 *  1. 接收前端單檔上傳 (Multer => uploads/)
 *  2. 先透過 authMiddleware 驗證 JWT，確認使用者身分
 *  3. 再透過 planMiddleware('upload') 檢查用戶方案上傳上限
 *  4. 交給 uploadController.uploadFile 進行實際檔案處理
 *********************************************************************************/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
// 必須是 planMiddleware.js（小寫 i）
const planMiddleware = require('../middleware/planMiddleware');
const uploadController = require('../controllers/uploadController');

const upload = multer({ dest: 'uploads/' });

router.post(
  '/',
  authMiddleware,
  planMiddleware('upload'),
  upload.single('file'),
  uploadController.uploadFile
);

module.exports = router;
