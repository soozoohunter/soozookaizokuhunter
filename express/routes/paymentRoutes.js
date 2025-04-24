/*************************************************************
 * express/routes/paymentRoutes.js
 * 
 * 同時包含：
 *  1) GET /api/pricing
 *  2) POST /api/purchase
 *  3) GET /api/payment/info
 *  4) POST /api/payment/notify
 *  5) POST /api/payment/submit
 *  6) 範例：/someProtectedUpload => planMiddleware('upload')
 *************************************************************/
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { planMiddleware } = require('../middleware/planMiddleware');
const paymentController = require('../controllers/paymentController');

// 1) GET /api/pricing
router.get('/pricing', paymentController.getPricing);

// 2) POST /api/purchase
router.post('/purchase', paymentController.purchasePlan);

// 3) GET /api/payment/info
router.get('/payment/info', authMiddleware, paymentController.getInfo);

// 4) POST /api/payment/notify
router.post('/payment/notify', authMiddleware, paymentController.notify);

// 5) POST /api/payment/submit
router.post('/payment/submit', authMiddleware, paymentController.submitPayment);

// ★ (示範) 若某路由要檢查方案
router.post('/someProtectedUpload',
  authMiddleware,
  planMiddleware('upload'),
  (req, res) => {
    return res.json({ message: '成功上傳 (依方案檢查過)' });
  }
);

module.exports = router;
