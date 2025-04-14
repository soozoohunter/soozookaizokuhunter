// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// GET /api/payment/info
router.get('/info', authMiddleware, paymentController.getInfo);

// POST /api/payment/notify
router.post('/notify', authMiddleware, paymentController.notify);

// (可自定 /submit, etc.)
router.post('/submit', authMiddleware, paymentController.submitPayment);

module.exports = router;
