// express/routes/dashboard.js (修正模型命名)
const express = require('express');
const { Op } = require('sequelize');
// [FIX] 將 UserSubscriptions (複數) 更正為 UserSubscription (單數)，與 models/index.js 的匯出保持一致
const { User, UserSubscription, SubscriptionPlan, UsageRecord, File, Scan } = require('../models');
const auth = require('../middleware/auth.js');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in token.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // [FIX] 使用正確的單數模型名稱 UserSubscription
    const activeSubscription = await UserSubscription.findOne({
      where: { user_id: userId, status: 'active' },
      // 確保您的 model 關聯 (association) 使用了 'plan' 這個別名
      include: { model: SubscriptionPlan, as: 'plan' }
    });

    let plan, expires_at;
    if (activeSubscription && activeSubscription.plan) {
        plan = activeSubscription.plan;
        expires_at = activeSubscription.expires_at;
    } else {
        logger.warn(`User ${userId} has no active subscription, providing default free plan data.`);
        // 如果使用者沒有有效訂閱，我們給他一個預設的免費方案資料結構
        // 注意：這裡的欄位名稱需要與您 `SubscriptionPlans` 資料表中的欄位完全對應
        plan = {
            name: 'Free Trial',
            video_limit: 0,
            image_limit: 5,
            scan_frequency_in_hours: 48,
            dmca_takedown_limit_monthly: 0,
            scan_limit_monthly: 10, // 確保預設物件也包含所有需要的欄位
        };
        expires_at = null;
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    // [FIX] 優化用量查詢邏輯，使其更準確
    const [imageUsage, scanUsage, dmcaUsage] = await Promise.all([
      File.count({ where: { user_id: userId } }), // 總上傳數
      Scan.count({ 
          where: { 
              createdAt: { [Op.gte]: startOfMonth },
          },
          include: [{ model: File, as: 'file', where: { user_id: userId }, attributes: [] }]
      }), // 當月掃描量
      UsageRecord.count({ where: { user_id: userId, feature_code: 'dmca_takedown', created_at: { [Op.gte]: startOfMonth } } }) // 當月 DMCA 用量
    ]);

    const recentProtectedFiles = await File.findAll({ where: { user_id: userId }, order: [['createdAt', 'DESC']], limit: 5 });
    const recentScans = await Scan.findAll({
      where: { file_id: { [Op.in]: recentProtectedFiles.map(f => f.id) } },
      include: { model: File, as: 'file' },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      userInfo: {
        id: user.id,
        email: user.email,
        realName: user.realName,
