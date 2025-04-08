// express/routes/ExpressRootPayment.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config();

const { STRIPE_SECRET } = process.env;
const stripe = new Stripe(STRIPE_SECRET);

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

module.exports = router;
