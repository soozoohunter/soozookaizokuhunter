/********************************************************************
 * express/controllers/paymentController.js
 ********************************************************************/
const { User } = require('../models');

const paymentController = {
  // 1) GET Pricing
  getPricing(req, res) {
    const plans = [
      { name: 'freeTrial', price: 0, desc: '限時一次免費上傳' },
      { name: 'monthlyPro', price: 299, desc: '每月訂閱 / 無限次上傳' },
      { name: 'dmcaOneTime', price: 99, desc: '單次 DMCA 下架服務' }
    ];
    return res.json(plans);
  },

  // 2) POST purchase
  purchasePlan: async (req, res) => {
    try {
      const { userId, plan } = req.body;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      user.plan = plan;
      await user.save();
      return res.json({ message: `方案已升級為: ${plan}` });
    } catch (err) {
      console.error('[purchasePlan error]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // 3) GET Info
  getInfo(req, res) {
    const info = {
      bankName: process.env.BANK_NAME || '台灣遠東國際商業銀行',
      bankCode: '805',
      bankAccount: process.env.BANK_ACCOUNT || '00200400371797',
      bankAccountName: process.env.BANK_ACCOUNT_NAME || 'YaoShengDE',
      planPrice: process.env.PLAN_PRICE || 999,
      currency: process.env.CURRENCY || 'TWD'
    };
    return res.json(info);
  },

  // 4) POST notify
  notify: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { paymentRef, contact } = req.body;
      // 您可選擇要更新 user.phone 或 user.address:
      await User.update({ phone: contact }, { where: { id: userId } });
      return res.json({ message: '付款資訊已提交(Phone已更新)' });
    } catch (err) {
      console.error('[notify error]', err);
      return res.status(500).json({ error: '付款通知失敗' });
    }
  },

  // 5) POST submitPayment
  submitPayment: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { lastFive, amount, planWanted } = req.body;
      console.log(`[submitPayment] user ${userId}, last5=${lastFive}, amount=${amount}, plan=${planWanted}`);
      // 您可把匯款資料寫入 DB ...
      return res.json({ message: '已收到匯款資訊，等待管理員確認' });
    } catch (err) {
      console.error('[submitPayment error]', err);
      return res.status(500).json({ error: '提交匯款資訊失敗' });
    }
  }
};

module.exports = paymentController;
