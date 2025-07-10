// express/middleware/quotaCheck.js
const { User, UsageRecord, SubscriptionPlan, UserSubscription } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const checkQuota = (featureCode) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const validFeatureCodes = ['image_upload', 'scan', 'dmca_takedown'];

            if (!validFeatureCodes.includes(featureCode)) {
                // 直接返回錯誤，而不是讓程式崩潰
                logger.warn(`[QuotaCheck] Invalid feature code used: ${featureCode}`);
                return res.status(400).json({ error: 'Invalid feature code for quota check.' });
            }

            const activeSubscription = await UserSubscription.findOne({
                where: { user_id: userId, status: 'active' },
                include: { model: SubscriptionPlan, as: 'plan' }
            });

            if (!activeSubscription || !activeSubscription.plan) {
                logger.warn(`[QuotaCheck] User ${userId} has no active subscription. Denying access.`);
                return res.status(403).json({ error: 'No active subscription found. Please subscribe to a plan.' });
            }

            const plan = activeSubscription.plan;
            let limit = 0;
            let usage = 0;
            
            // 根據功能代碼，決定如何計算用量和上限
            switch (featureCode) {
                case 'image_upload':
                    limit = plan.image_limit;
                    usage = await UsageRecord.count({ where: { user_id: userId, feature_code: 'image_upload' } });
                    break;
                case 'scan':
                case 'dmca_takedown':
                    limit = featureCode === 'scan' ? plan.scan_limit_monthly : plan.dmca_takedown_limit_monthly;
                    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                    usage = await UsageRecord.count({ 
                        where: { user_id: userId, feature_code: featureCode, created_at: { [Op.gte]: startOfMonth } } 
                    });
                    break;
            }

            if (usage >= limit) {
                logger.warn(`[QuotaCheck] User ${userId} exceeded quota for ${featureCode}. Usage: ${usage}, Limit: ${limit}`);
                return res.status(403).json({ error: `Quota exceeded for ${featureCode}. Usage: ${usage}/${limit}. Please upgrade your plan.` });
            }

            // 用量檢查通過
            next();

        } catch (error) {
            logger.error('[QuotaCheck Middleware] Error:', error);
            return res.status(500).json({ error: 'An internal error occurred during quota check.' });
        }
    };
};

module.exports = checkQuota;
