/********************************************************************
 * express/controllers/paymentController.js (保留您原本邏輯)
 * 
 * 假設有 5 隻主要 function：
 *   1) getPricing
 *   2) purchasePlan
 *   3) getInfo
 *   4) notify
 *   5) submitPayment
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

  // 2) POST purchase (購買/升級)
  purchasePlan: async (req, res) => {
    try {
      const { userId, plan } = req.body;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      user.plan = plan;
      await user.save();
      return res.json({ message: `已將方案升級為：${plan}` });
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

  // 4) POST notify (用戶通知已匯款)
  notify: async (req, res) => {
    try {
      const userId = req.user.userId; // 從 authMiddleware 取得 user
      const { paymentRef, contact } = req.body;
      // 隨便改某欄位來紀錄
      await User.update({ address: contact }, { where: { id: userId } });
      return res.json({ message: '付款資訊已提交(地址已更新)' });
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
      console.log(`[submitPayment] userId=${userId}, last5=${lastFive}, amount=${amount}, plan=${planWanted}`);
      // 可將紀錄寫入 Payment Table
      return res.json({ message: '已收到匯款資訊，等待管理員確認' });
    } catch (err) {
      console.error('[submitPayment error]', err);
      return res.status(500).json({ error: '提交匯款資訊失敗' });
    }
  }
};

module.exports = paymentController;
