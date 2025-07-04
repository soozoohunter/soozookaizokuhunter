// express/routes/dashboard.js (健壯性與防禦性修正版)
const express = require('express');
const { Op } = require('sequelize');
const { User, UserSubscriptions, SubscriptionPlans, UsageRecord, File, Scan } = require('../models');
const auth = require('../middleware/authMiddleware');
const logger = require('../utils/logger'); // 引入 logger

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in token.' });
    }

    // 步驟 1: 獲取使用者基本資訊
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 步驟 2: 獲取使用者當前的有效訂閱方案
    const activeSubscription = await UserSubscriptions.findOne({
      where: { user_id: userId, status: 'active' },
      include: { model: SubscriptionPlans, as: 'plan' }
    });

    // 步驟 3: [FIX] 防禦性處理，如果沒有有效訂閱，則提供一個預設的 "Free" 方案物件
    let plan, expires_at;
    if (activeSubscription && activeSubscription.plan) {
        plan = activeSubscription.plan;
        expires_at = activeSubscription.expires_at;
    } else {
        // 提供一個無害的預設物件，避免後續程式讀取 null 屬性而出錯
        logger.warn(`User ${userId} has no active subscription, providing default free plan data.`);
        plan = {
            name: 'Free Trial',
            video_limit: 0,
            image_limit: 5,
            scan_frequency_in_hours: 48,
            dmca_takedown_limit_monthly: 0,
        };
        expires_at = null; // 或者給一個過去的時間
    }

    // 步驟 4: 計算用量
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [imageUsage, scanUsage, dmcaUsage, totalImageCount] = await Promise.all([
      UsageRecord.count({ where: { user_id: userId, feature_code: 'image_upload' } }), // 圖片總量
      UsageRecord.count({ where: { user_id: userId, feature_code: 'scan', created_at: { [Op.gte]: startOfMonth } } }), // 當月掃描量
      UsageRecord.count({ where: { user_id: userId, feature_code: 'dmca_takedown', created_at: { [Op.gte]: startOfMonth } } }) // 當月 DMCA 用量
    ]);

    // 步驟 5: 獲取最近活動
    const recentProtectedFiles = await File.findAll({ where: { user_id: userId }, order: [['createdAt', 'DESC']], limit: 5 });
    const recentScans = await Scan.findAll({
      where: { file_id: recentProtectedFiles.map(f => f.id) }, // 只查最近5個檔案的掃描
      include: { model: File, as: 'file' },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // 步驟 6: [FIX] 組合健壯的 JSON 回應
    res.json({
      userInfo: {
        id: user.id,
        email: user.email,
        realName: user.realName,
      },
      planInfo: {
        name: plan.name,
        // 使用可選串連 (optional chaining) 和空值合併運算符 (nullish coalescing) 避免錯誤
        expires_at: expires_at,
      },
      usage: {
        images: { used: totalImageCount, limit: plan.image_limit ?? 5 },
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
