/*************************************************************
 * express/routes/paymentRoutes.js
 *************************************************************/
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware'); // 若有
const { planMiddleware } = require('../middleware/planMiddleware'); // 若有
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

// 如果要示範 planMiddleware:
// router.post('/someProtectedUpload', authMiddleware, planMiddleware('upload'), ...);

module.exports = router;
