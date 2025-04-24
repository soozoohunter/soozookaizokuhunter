/*************************************************************
 * express/routes/payment.js (使用 Sequelize Payment Model)
 *************************************************************/
const express = require('express');
const router = express.Router();
const { Payment } = require('../models'); 
const authMiddleware = require('../middleware/authMiddleware');

/** 
 * POST /api/pay => 建立付款(待審核)
 * body: { item, price } 
 */
router.post('/pay', async (req, res) => {
  const { item, price } = req.body;
  const SERVICE_PRICING = {
    download_certificate: 99,
    infringement_scan: 99,
    dmca_submit: 299,
    legal_support: 9990
  };
  // 驗證
  const cost = SERVICE_PRICING[item];
  if (!cost) {
    return res.status(400).json({ error: 'Invalid item' });
  }
  if (+price !== cost) {
    return res.status(400).json({ error: 'Price mismatch' });
  }
  try {
    // ★ 假設無登入 => userId=null
    // 若實務需要 JWT: const userId = req.user.userId; (authMiddleware)
    const userId = null;
    const payment = await Payment.create({
      userId: userId,
      lastFive: '',
      amount: cost,
      planWanted: 'BASIC', // or 依 item
      status: 'PENDING'
    });
    return res.json({ success: true, paymentId: payment.id });
  } catch (err) {
    console.error('[Payment] error:', err);
    return res.status(500).json({ error: 'Payment creation failed' });
  }
});

/**
 * 管理員審核 => POST /api/admin/payments/:id/approve
 */
router.post('/admin/payments/:id/approve', authMiddleware, async (req, res) => {
  const paymentId = req.params.id;
  try {
    // 找到 payment
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'No record found' });
    }
    payment.status = 'APPROVED';
    await payment.save();
    return res.json({ success: true, payment });
  } catch (err) {
    console.error('[Payment approve] error:', err);
    return res.status(500).json({ error: 'Approve payment failed' });
  }
});

module.exports = router;
