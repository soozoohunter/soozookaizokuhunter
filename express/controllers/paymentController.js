/********************************************************************
 * controllers/paymentController.js
 ********************************************************************/
const { User } = require('../models');

const paymentController = {
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

  notify: async (req, res) => {
    // 用戶提交匯款資料
    try {
      const userId = req.user.userId;
      const { paymentRef, contact } = req.body;
      await User.update({ userName: contact }, { where: { id: userId } });
      return res.json({ message: '付款資訊已提交' });
    } catch (err) {
      console.error('[payment notify] error:', err);
      return res.status(500).json({ error: '付款通知失敗' });
    }
  },

  submitPayment: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { lastFive, amount, planWanted } = req.body;
      // 在此可寫入 PaymentRecord, 待管理員核對
      // mock
      console.log(`[submitPayment] user ${userId}, last5=${lastFive}, amount=${amount}, plan=${planWanted}`);
      return res.json({ message: '已收到匯款資訊，請等待管理員確認' });
    } catch (err) {
      console.error('[submitPayment] error:', err);
      return res.status(500).json({ error: '提交匯款資訊失敗' });
    }
  }
};

module.exports = paymentController;
