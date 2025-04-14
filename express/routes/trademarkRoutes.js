// routes/trademarkRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const planMiddleware = require('../middleware/planMiddleware');
const TrademarkController = require('../controllers/trademarkController');

// GET /api/trademarks/search?q=keyword - 查詢商標資訊
router.get('/search', 
  authMiddleware, 
  planMiddleware('api'),   // 檢查 API 調用次數限額
  TrademarkController.search
);

module.exports = router;
