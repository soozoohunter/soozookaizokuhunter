// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const PaymentController = require('../controllers/paymentController');

// GET /api/payment/info - 獲取匯款帳號資訊（需登入後才能查看）
router.get('/info', authMiddleware, PaymentController.getInfo);

// POST /api/payment/notify - 用戶提交已匯款通知與基本資料
router.post('/notify', authMiddleware, PaymentController.notify);

module.exports = router;
