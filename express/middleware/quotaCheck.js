// express/middleware/quotaCheck.js
const { Op } = require('sequelize');
const { UserSubscription, SubscriptionPlan, UsageRecord, File } = require('../models');
const logger = require('../utils/logger');

const checkQuota = (featureCode) => async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const validFeatureCodes = ['image_upload', 'scan', 'dmca_takedown'];
        if (!validFeatureCodes.includes(featureCode)) {
            logger.warn(`[QuotaCheck] Invalid feature code provided: ${featureCode}`);
            return res.status(400).json({ error: 'Invalid feature code for quota check.' });
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
        let requestedAmount = (req.files && req.files.length > 0) ? req.files.length : 1;

        switch (featureCode) {
            case 'image_upload':
                // works_quota corresponds to the total number of stored works
                limit = plan.works_quota;
                usage = await File.count({ where: { user_id: userId } });
                break;
            
            case 'scan':
                // monthly scan credits
                limit = plan.scan_quota_monthly;
                const startOfMonthScan = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                usage = await UsageRecord.count({
                    where: { user_id: userId, feature_code: 'scan', created_at: { [Op.gte]: startOfMonthScan } }
                });
                break;

            case 'dmca_takedown':
                // monthly DMCA takedown credits
                limit = plan.dmca_quota_monthly;
                const startOfMonthDmca = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                usage = await UsageRecord.count({
                    where: { user_id: userId, feature_code: 'dmca_takedown', created_at: { [Op.gte]: startOfMonthDmca } }
                });
                break;
        }

        // limit 為 null 或 undefined 代表無限制
        if (limit != null && (usage + requestedAmount > limit)) {
            const remaining = limit - usage > 0 ? limit - usage : 0;
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
