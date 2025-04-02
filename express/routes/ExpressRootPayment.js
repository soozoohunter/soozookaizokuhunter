const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config();

const { STRIPE_SECRET } = process.env;
const stripe = new Stripe(STRIPE_SECRET);

// 建立訂閱
router.post('/subscribe', async (req, res) => {
  const { priceId, userEmail } = req.body;
  if (!priceId || !userEmail) {
    return res.status(400).json({ error: '缺少 priceId 或 userEmail' });
  }
  try {
    const customer = await stripe.customers.create({ email: userEmail });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });
    res.json({
      message: '訂閱建立成功',
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (err) {
    console.error('建立訂閱失敗:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Stripe Webhook 驗證
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_SECRET);
  } catch (err) {
    console.error('Webhook 驗證錯誤:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // 根據事件類型處理業務邏輯
  if (event.type === 'invoice.payment_succeeded') {
    // 更新 DB 訂閱狀態，發送通知等
  }
  res.json({ received: true });
});

module.exports = router;
