const logger = require('./utils/logger');
const db = require('./models');

async function seedDatabase() {
  try {
    const SubscriptionPlan = db.SubscriptionPlan;

    if (!SubscriptionPlan) {
      const models = Object.keys(db).filter(key => !['sequelize', 'Sequelize'].includes(key));
      throw new Error(`SubscriptionPlan model not found. Available models: ${models.join(', ')}`);
    }

    logger.info('[Seed] Starting database seeding process...');

    const plans = [
      { plan_code: "free_trial", name: "Free Trial", monthly_price: 0, image_limit: 5, scan_limit_monthly: 10, dmca_takedown_limit_monthly: 0, scan_frequency_in_hours: 48, has_legal_consultation: false },
      { plan_code: "basic", name: "BASIC", monthly_price: 490, image_limit: 5, video_limit: 3, scan_limit_monthly: 30, dmca_takedown_limit_monthly: 1, scan_frequency_in_hours: 24, has_legal_consultation: false },
      { plan_code: "pro", name: "PRO", monthly_price: 1290, image_limit: 30, video_limit: 10, scan_limit_monthly: 30, dmca_takedown_limit_monthly: 3, scan_frequency_in_hours: 24, has_legal_consultation: true },
      { plan_code: "enterprise", name: "ENTERPRISE", monthly_price: 3990, image_limit: null, video_limit: null, scan_limit_monthly: null, dmca_takedown_limit_monthly: null, scan_frequency_in_hours: 1, has_legal_consultation: true },
      { plan_code: "pay_per_feature", name: "PAY_PER_FEATURE", monthly_price: 0, annual_price: 0, video_limit: null, image_limit: null, image_upload_limit: null, scan_limit_monthly: null, dmca_free: 0, dmca_takedown_limit_monthly: 0, scan_frequency_in_hours: 24, scan_frequency: "24h", has_legal_consultation: false }
    ];
    for (const plan of plans) {
      await SubscriptionPlan.findOrCreate({ where: { plan_code: plan.plan_code }, defaults: plan });
    }

    logger.info('[Seed] Subscription plans initialized.');
    logger.info('[Seed] Database seeding completed successfully.');
    return true;
  } catch (error) {
    logger.error('[Seed] Error during seeding:', error);
    throw new Error('Database seeding failed: ' + error.message);
  }
}

module.exports = seedDatabase;
