/********************************************************************
 * express/controllers/paymentController.js
 * 
 * 同時包含以下函式：
 *  - getPricing      (回傳可用方案)
 *  - purchasePlan    (購買 / 升級方案)
 *  - getInfo         (您原本的 getInfo)
 *  - notify          (您原本的 notify，但將 username 全轉小寫)
 *  - submitPayment   (您原本的 submitPayment)
 ********************************************************************/
const { User } = require('../models');

const paymentController = {
  /**
   * 1) 取得可用方案 (原 /api/pricing)
   */
  getPricing(req, res) {
    const plans = [
      { name: 'freeTrial', price: 0, desc: '限時一次免費上傳' },
      { name: 'monthlyPro', price: 299, desc: '每月訂閱 / 無限次上傳' },
      { name: 'dmcaOneTime', price: 99, desc: '單次 DMCA 下架服務' }
    ];
    return res.json(plans);
  },

  /**
   * 2) 購買 / 升級方案 (原 /api/purchase)
   */
  purchasePlan: async (req, res) => {
    try {
      const { userId, plan } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Mock: 更新 user.plan
      user.plan = plan;
      await user.save();

      return res.json({ message: `方案已升級為 ${plan}` });
    } catch (err) {
      console.error('[purchasePlan error]', err);
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * 3) 取得銀行資訊 (原 getInfo)
   *    => GET /api/payment/info
   */
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

  /**
   * 4) 用戶提交匯款資料 (原 notify)
   *    => POST /api/payment/notify
   * 
   *  ★ 若您確定要以 contact 覆蓋使用者的 username，
   *    可統一小寫，以免大小寫衝突
   */
  notify: async (req, res) => {
    try {
      const userId = req.user.userId;  // 從 token 解出 userId
      const { paymentRef, contact } = req.body;

      // => 方式 A: 真的要更新 username
      //    全部轉成小寫
      const newUserName = contact.trim().toLowerCase();

      await User.update({ username: newUserName }, { where: { id: userId } });

      // => 方式 B: 如果只是聯絡資訊，不想動 username：
      //    await User.update({ address: contact }, { where: { id: userId } });

      // => 依您的需求二擇一(上面A或B)。以下先示範 A。
      
      return res.json({ message: '付款資訊已提交 (username已轉小寫).' });
    } catch (err) {
      console.error('[payment notify] error:', err);
      return res.status(500).json({ error: '付款通知失敗' });
    }
  },

  /**
   * 5) 用戶提交匯款 (原 submitPayment)
   *    => POST /api/payment/submit
   */
  submitPayment: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { lastFive, amount, planWanted } = req.body;
      console.log(`[submitPayment] user ${userId}, last5=${lastFive}, amount=${amount}, plan=${planWanted}`);
      // TODO: 這裡可寫入 PaymentRecord or update user.plan ...
      return res.json({ message: '已收到匯款資訊，請等待管理員確認' });
    } catch (err) {
      console.error('[submitPayment] error:', err);
      return res.status(500).json({ error: '提交匯款資訊失敗' });
    }
  }
};

module.exports = paymentController;
