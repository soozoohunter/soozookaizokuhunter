// controllers/paymentController.js
const PaymentController = {
  // 取得匯款資訊
  getInfo: (req, res) => {
    // 從環境變數或設定中取得匯款相關資訊
    const info = {
      bankName: process.env.BANK_NAME,
      bankAccount: process.env.BANK_ACCOUNT,
      bankAccountName: process.env.BANK_ACCOUNT_NAME,
      // 其他資訊如費用、說明等
      amount: process.env.PLAN_PRICE || null,
      currency: process.env.CURRENCY || 'TWD'
    };
    return res.json({ bankInfo: info });
  },

  // 提交匯款通知（及基本資料）
  notify: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { name, contact, paymentRef } = req.body;
      // 更新使用者基本資料（姓名, 聯絡方式等）
      await User.findByIdAndUpdate(userId, { name, contact });
      // 紀錄付款通知 (例如寫入資料庫 PaymentRecord)
      // 這裡簡單模擬寫入，可以擴充 PaymentRecord 模型保存更多資訊
      // const record = await PaymentRecord.create({ user: userId, paymentRef, planRequested: 'premium', status: 'pending' });
      // 返回成功響應
      return res.json({ message: '付款資訊已提交，請等待管理員確認。' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = PaymentController;
