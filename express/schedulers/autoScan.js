require('dotenv').config();
const db = require('../models');
const logger = require('../utils/logger');
const queueService = require('../services/queue.service');

async function run() {
  try {
    await db.connectToDatabase();
    await queueService.connect();

    const subs = await db.UserSubscription.findAll({
      where: { status: 'active' },
      include: { model: db.SubscriptionPlan, as: 'plan' }
    });

    const now = new Date();

    for (const sub of subs) {
      const plan = sub.plan;
      if (!plan || !plan.scan_frequency_in_hours) continue;
      const threshold = new Date(now.getTime() - plan.scan_frequency_in_hours * 60 * 60 * 1000);
      const files = await db.File.findAll({ where: { user_id: sub.user_id } });

      for (const file of files) {
        const lastScan = await db.Scan.findOne({
          where: { file_id: file.id },
          order: [['createdAt', 'DESC']]
        });
        if (!lastScan || lastScan.createdAt < threshold) {
          const scan = await db.Scan.create({ file_id: file.id, status: 'pending' });
          await queueService.sendToQueue({
            taskId: scan.id,
            fileId: file.id,
            ipfsHash: file.ipfs_hash,
            fingerprint: file.fingerprint,
          });
          logger.info(`[AutoScan] Scheduled scan ${scan.id} for file ${file.id}`);
        }
      }
    }

    logger.info('[AutoScan] Scheduler run complete');
    process.exit(0);
  } catch (err) {
    logger.error('[AutoScan] Failed', err);
    process.exit(1);
  }
}

run();
