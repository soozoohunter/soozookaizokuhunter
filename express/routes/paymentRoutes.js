/*************************************************************
 * express/routes/payment.js
 * 
 * 統一挂載到 /api (可 /api/pricing, /api/purchase...)
 *************************************************************/
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 若您有 authMiddleware:
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

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

module.exports = router;
