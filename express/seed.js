const logger = require('./utils/logger');
const db = require('./models');

async function seedDatabase() {
  try {
    const Role = db.Role || db.Roles;
    const Plan = db.Plan || db.Plans;

    if (!Role || !Plan) {
      const models = Object.keys(db).filter(key => !['sequelize', 'Sequelize', 'syncDatabase'].includes(key));
      throw new Error(`Role/Plan models not found. Available models: ${models.join(', ')}`);
    }

    logger.info('[Seed] Starting database seeding process...');

    await Role.findOrCreate({
      where: { name: 'user' },
      defaults: { name: 'user', description: '普通用戶' }
    });

    await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: { name: 'admin', description: '管理員' }
    });

    logger.info('[Seed] User roles initialized.');

    await Plan.findOrCreate({
      where: { name: 'free_trial' },
      defaults: {
        name: 'free_trial',
        price: 0.0,
        upload_limit: 1,
        scan_limit: 1,
        features: JSON.stringify(['basic_scan', 'google_vision']),
        description: '免費體驗方案，包含一次上傳與基本侵權偵測。'
      }
    });

    await Plan.findOrCreate({
      where: { name: 'professional' },
      defaults: {
        name: 'professional',
        price: 49.99,
        upload_limit: 50,
        scan_limit: 100,
        features: JSON.stringify(['full_scan', 'google_vision', 'tineye', 'social_media', 'dmca_takedown']),
        description: '專業方案，包含完整侵權偵測與一鍵申訴功能。'
      }
    });

    logger.info('[Seed] Subscription plans initialized.');
    logger.info('[Seed] Database seeding completed successfully.');
    return true;
  } catch (error) {
    logger.error('[Seed] Error during seeding:', error);
    throw new Error('Database seeding failed: ' + error.message);
  }
}

module.exports = seedDatabase;
