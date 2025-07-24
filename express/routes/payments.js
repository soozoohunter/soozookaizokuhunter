const express = require('express');
const router = express.Router();
const { PaymentProof, User, InfringementCase } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

router.post('/submit-proof', auth, async (req, res) => {
    const { planCode, amount, accountLastFive, userEmail, notes } = req.body;
    const userId = req.user.id;

    if (!planCode || !amount || !accountLastFive || !userEmail) {
        return res.status(400).json({ message: '缺少必要資訊' });
    }

    try {
        await PaymentProof.create({
            user_id: userId,
            plan_code: planCode,
            amount: parseFloat(amount),
            account_last_five: accountLastFive,
            user_email: userEmail,
            notes: notes,
            status: 'pending' // 狀態為待審核
        });

        // TODO: 在此處整合 Email 服務，發送確認信給使用者
        // await emailService.sendPaymentProofReceivedEmail(userEmail);

        logger.info(`[Payment] Received payment proof from User ID: ${userId} for plan ${planCode}`);
        res.status(201).json({ message: '已成功收到您的付款證明，我們將在 1 個工作小時內完成審核並為您開通權限。' });
    } catch (error) {
        logger.error('[Payment] Error submitting proof:', error);
        res.status(500).json({ message: '提交證明時發生伺服器錯誤。' });
    }
});

// 授權購買處理
router.post('/purchase-license', async (req, res) => {
  const { caseId, paymentMethod } = req.body;

  try {
    const infringementCase = await InfringementCase.findByPk(caseId, {
      include: [{ model: User }, { model: require('../models').File }]
    });

    if (!infringementCase) {
      return res.status(404).json({ message: '找不到此案件' });
    }

    // TODO: 整合實際支付邏輯

    await infringementCase.update({
      resolution_status: 'license_purchased',
      license_revenue: infringementCase.license_price
    });

    const creatorRevenue = infringementCase.license_price * infringementCase.creator_share;
    const platformRevenue = infringementCase.license_price * infringementCase.platform_share;

    logger.info(`[P2P] License purchased for case ${caseId}. Creator: ${creatorRevenue}, Platform: ${platformRevenue}`);

    res.json({
      success: true,
      message: '授權購買成功',
      revenue: {
        creator: creatorRevenue,
        platform: platformRevenue
      }
    });
  } catch (error) {
    logger.error('[Payment] License purchase error:', error);
    res.status(500).json({ message: '授權購買失敗' });
  }
});

module.exports = router;
