/*************************************************************
 * express/routes/paymentRoutes.js
 * 
 * 統一掛載到 /api/... 
 *************************************************************/
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 若您有 JWT 驗證中介層:
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

// 簡易 authMiddleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // 後續可由 req.user.userId 取得
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// 1) GET /api/pricing
router.get('/pricing', paymentController.getPricing);

// 2) POST /api/purchase
router.post('/purchase', paymentController.purchasePlan);

// 3) GET /api/payment/info (需登入)
router.get('/payment/info', authMiddleware, paymentController.getInfo);

// 4) POST /api/payment/notify (需登入)
router.post('/payment/notify', authMiddleware, paymentController.notify);

// 5) POST /api/payment/submit (需登入)
router.post('/payment/submit', authMiddleware, paymentController.submitPayment);

module.exports = router;
