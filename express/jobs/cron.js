const cron = require('node-cron');
const { User, SubscriptionPlan, UserSubscription, File, Scan, sequelize } = require('../models');
const { Op } = require('sequelize');
const queueService = require('../services/queue.service');
const logger = require('../utils/logger');

const startScheduledScans = () => {
    cron.schedule('0 3 * * *', async () => {
        logger.info('[Cron] Starting daily scheduled scan job...');
        const transaction = await sequelize.transaction();
        try {
            const now = new Date();
            const subscriptions = await UserSubscription.findAll({
                where: { status: 'active', expires_at: { [Op.gte]: now } },
                include: [
                    {
                        model: SubscriptionPlan,
                        as: 'plan',
                        where: { [Op.or]: [{ scan_frequency: 'daily' }, { scan_frequency: 'weekly' }] }
                    },
                    { model: User, include: [{ model: File, as: 'Files' }] }
                ],
                transaction
            });

            for (const sub of subscriptions) {
                const plan = sub.plan;
                const user = sub.User;
                const filesToScan = user.Files || [];

                if (plan.scan_frequency === 'daily' || (plan.scan_frequency === 'weekly' && now.getDay() === 1)) {
                    logger.info(`[Cron] Scheduling scans for user ${user.email} (Plan: ${plan.name})`);
                    for (const file of filesToScan) {
                        const scan = await Scan.create({
                            file_id: file.id, user_id: user.id, status: 'pending',
                            initiated_by: 'system_auto'
                        }, { transaction });
                        await queueService.sendToQueue({
                            scanId: scan.id, fileId: file.id, userId: user.id,
                            ipfsHash: file.ipfs_hash, fingerprint: file.fingerprint, keywords: file.keywords,
                        });
                    }
                }
            }
            await transaction.commit();
            logger.info('[Cron] Daily scheduled scan job finished.');
        } catch (error) {
            await transaction.rollback();
            logger.error('[Cron] Error during scheduled scan job:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Taipei'
    });
};

module.exports = { startScheduledScans };
