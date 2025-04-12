const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Payment = require('../models/Payment');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function authMiddleware(req, res, next){
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/,'');
    if(!token) return res.status(401).json({ error:'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch(e){
    return res.status(401).json({ error:'Invalid token' });
  }
}

// 用戶提交匯款資訊
router.post('/submit', authMiddleware, async (req, res)=>{
  try {
    const { lastFive, amount, planWanted } = req.body;
    if(!lastFive || !amount || !planWanted){
      return res.status(400).json({ error:'後五碼、金額、方案不可空' });
    }

    const newPay = await Payment.create({
      userId:req.user.id,
      lastFive,
      amount,
      planWanted
    });
    return res.json({ message:'匯款資訊已提交，待審核', paymentId:newPay.id });
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

// 管理員審核
router.post('/verify', async (req, res)=>{
  try {
    const { paymentId, action } = req.body;  // 'APPROVE' or 'REJECT'
    const pay = await Payment.findByPk(paymentId);
    if(!pay) return res.status(404).json({ error:'Payment not found' });

    if(action==='APPROVE'){
      pay.status='APPROVED';
      await pay.save();

      // 幫該 user 升級
      const user = await User.findByPk(pay.userId);
      if(!user) return res.status(404).json({ error:'User not found' });
      user.plan= pay.planWanted;
      await user.save();

      return res.json({ message:`已核准匯款，方案升級為 ${user.plan}`});
    } else {
      pay.status='REJECTED';
      await pay.save();
      return res.json({ message:'已標記為拒絕' });
    }
  } catch(e){
    res.status(500).json({ error:e.message });
  }
});

module.exports = router;
