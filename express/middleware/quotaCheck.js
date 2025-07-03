// express/middleware/quotaCheck.js
const { UserSubscriptions, UsageRecord, SubscriptionPlans } = require('../models');
const { Op } = require('sequelize');

const checkQuota = (featureCode) => async (req, res, next) => {
    try {
        const userId = req.user.id || req.user.userId;

        const activeSubscription = await UserSubscriptions.findOne({
            where: { user_id: userId, status: 'active' },
            include: { model: SubscriptionPlans, as: 'plan' }
        });

        if (!activeSubscription) {
            return res.status(403).json({ error: "No active subscription found." });
        }

        const planLimits = activeSubscription.plan;
        const limitField = `${featureCode}_limit_monthly`;
        const limit = planLimits[limitField];

        if (limit === null) {
            return next();
        }

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const usage = await UsageRecord.count({
            where: {
                user_id: userId,
                feature_code: featureCode,
                created_at: { [Op.gte]: startOfMonth }
            }
        });

        if (usage >= limit) {
            return res.status(403).json({
                error: `Monthly limit for '${featureCode}' reached. Please upgrade your plan.`
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: "Failed to verify quota." });
    }
};
module.exports = checkQuota;
