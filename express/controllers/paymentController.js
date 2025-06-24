/********************************************************************
 * express/controllers/paymentController.js
 *  - 5 隻主要 function： getPricing, purchasePlan, getInfo, notify, submitPayment
 *  - 保留您目前的邏輯 & DB 操作
 ********************************************************************/
const { User } = require('../models');
const logger = require('../utils/logger');

const paymentController = {
  // 1) GET /api/pricing
  getPricing(req, res) {
    const plans = [
      { name: 'freeTrial', price: 0, desc: '限時一次免費上傳' },
      { name: 'monthlyPro', price: 299, desc: '每月訂閱 / 無限次上傳' },
      { name: 'dmcaOneTime', price: 99, desc: '單次 DMCA 下架服務' }
    ];
    return res.json(plans);
  },

  // 2) POST /api/purchase
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
      logger.error('[purchasePlan error]', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // 3) GET /api/payment/info
  getInfo(req, res) {
    // 回傳匯款資訊 or 金流資訊
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

  // 4) POST /api/payment/notify
  // 用戶「通知」已匯款；可更新 DB 記錄或做其他動作
  notify: async (req, res) => {
    try {
      const userId = req.user.userId; // 從 authMiddleware 取得 JWT 解析出的 userId
      const { paymentRef, contact } = req.body;
      // 範例：更新使用者 address 或 phone 以紀錄
      await User.update({ address: contact }, { where: { id: userId } });
      return res.json({ message: '付款資訊已提交(已更新使用者資訊)' });
    } catch (err) {
      logger.error('[notify error]', err);
      return res.status(500).json({ error: '付款通知失敗' });
    }
  },

  // 5) POST /api/payment/submit
  // 用戶提交匯款資訊 (lastFive, amount, planWanted 等)
  submitPayment: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { lastFive, amount, planWanted } = req.body;
      logger.info(`[submitPayment] userId=${userId}, last5=${lastFive}, amount=${amount}, plan=${planWanted}`);

      // 假設可存到 Payment table or log
      // ...

      return res.json({ message: '已收到匯款資訊，等待管理員確認' });
    } catch (err) {
      logger.error('[submitPayment error]', err);
      return res.status(500).json({ error: '提交匯款資訊失敗' });
    }
  }
};

module.exports = paymentController;
