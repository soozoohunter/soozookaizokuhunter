// express/routes/dashboard.js (使用正確的基礎驗證)
const express = require('express');
const { Op } = require('sequelize');
const { User, UserSubscriptions, SubscriptionPlans, UsageRecord, File, Scan } = require('../models');
const auth = require('../middleware/auth.js'); // [修正] 引入新的基礎驗證中介層
const logger = require('../utils/logger');

const router = express.Router();

// [修正] router.get 的第二個參數現在是基礎的 auth，而不是管理員驗證
router.get('/', auth, async (req, res) => {
  try {
    // ... 此處的所有邏輯保持不變，因為它們是正確的 ...
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in token.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const activeSubscription = await UserSubscriptions.findOne({
      where: { user_id: userId, status: 'active' },
      include: { model: SubscriptionPlans, as: 'plan' }
    });

    let plan, expires_at;
    if (activeSubscription && activeSubscription.plan) {
        plan = activeSubscription.plan;
        expires_at = activeSubscription.expires_at;
    } else {
        logger.warn(`User ${userId} has no active subscription, providing default free plan data.`);
        plan = {
            name: 'Free Trial',
            video_limit: 0,
            image_limit: 5,
            scan_frequency_in_hours: 48,
            dmca_takedown_limit_monthly: 0,
        };
        expires_at = null;
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [imageUsage, scanUsage, dmcaUsage] = await Promise.all([
      File.count({ where: { user_id: userId } }), // 總上傳數
      Scan.count({ 
          where: { 
              createdAt: { [Op.gte]: startOfMonth },
              '$File.user_id$': userId 
          },
          include: [{ model: File, as: 'file', attributes: [] }]
      }), // 當月掃描量
      UsageRecord.count({ where: { user_id: userId, feature_code: 'dmca_takedown', created_at: { [Op.gte]: startOfMonth } } }) // 當月 DMCA 用量
    ]);

    const recentProtectedFiles = await File.findAll({ where: { user_id: userId }, order: [['createdAt', 'DESC']], limit: 5 });
    const recentScans = await Scan.findAll({
      where: { file_id: recentProtectedFiles.map(f => f.id) },
      include: { model: File, as: 'file' },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      userInfo: {
        id: user.id,
        email: user.email,
        realName: user.realName,
      },
      planInfo: {
        name: plan.name,
        expires_at: expires_at,
      },
      usage: {
        images: { used: imageUsage, limit: plan.image_limit ?? 5 },
        monthlyScan: { used: scanUsage, limit: plan.scan_limit_monthly ?? 10 },
        monthlyDmca: { used: dmcaUsage, limit: plan.dmca_takedown_limit_monthly ?? 0 },
      },
      protectedContent: recentProtectedFiles,
      recentScans
    });

  } catch (err) {
    logger.error(`[Dashboard API Error] Failed to load dashboard for user ${req.user.id}:`, err);
    res.status(500).json({ error: 'Failed to load dashboard data.' });
  }
});

module.exports = router;
