// express/middleware/quotaCheck.js (最終統一架構版)
const { Op } = require('sequelize');
const { UserSubscription, SubscriptionPlan, UsageRecord, File } = require('../models');
const logger = require('../utils/logger');

const checkQuota = (featureCode) => async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const activeSubscription = await UserSubscription.findOne({
            where: { user_id: userId, status: 'active' },
            include: { model: SubscriptionPlan, as: 'plan' }
        });

        if (!activeSubscription || !activeSubscription.plan) {
            return res.status(403).json({ error: "No active subscription plan found. Please contact support." });
        }

        const plan = activeSubscription.plan;
        
        let limit;
        let usage;
        let requestedAmount = 1;

        switch (featureCode) {
            case 'image_upload':
                limit = plan.image_limit;
                if (req.files && req.files.length > 0) {
                    requestedAmount = req.files.length;
                }
                // 圖片上傳總數限制是基於 `Files` 表的總行數
                usage = await File.count({ where: { user_id: userId } });
                break;
            
            case 'scan':
                limit = plan.scan_limit_monthly;
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                // 每月掃描次數是查詢 `UsageRecords` 表
                usage = await UsageRecord.count({
                    where: { user_id: userId, feature_code: 'scan', created_at: { [Op.gte]: startOfMonth } }
                });
                break;

            case 'dmca_takedown':
                limit = plan.dmca_takedown_limit_monthly;
                const startOfMonthDmca = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                usage = await UsageRecord.count({
                    where: { user_id: userId, feature_code: 'dmca_takedown', created_at: { [Op.gte]: startOfMonthDmca } }
                });
                break;

            default:
                return res.status(400).json({ error: 'Invalid feature code for quota check.' });
        }

        // limit 為 null 或 undefined 代表無限制
        if (limit != null && (usage + requestedAmount > limit)) {
            const remaining = limit - usage;
            return res.status(403).json({ 
                error: `Quota limit for '${featureCode}' reached. You have ${remaining} left, but tried to use ${requestedAmount}. Please upgrade your plan.`
            });
        }
        
        next();
    } catch (error) {
        logger.error(`[Quota Check Middleware] Error checking quota for '${featureCode}':`, error);
        res.status(500).json({ error: "Failed to verify quota." });
    }
};

module.exports = checkQuota;
