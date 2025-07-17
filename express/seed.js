const logger = require('./utils/logger');
// 導入由 models/index.js 準備好的 db 物件
const db = require('./models');

async function seedDatabase() {
    // 從 db 物件中解構出需要的模型
    const { Role, Plan } = db;

    // 增加防呆機制，確保模型物件和它們的方法都存在
    if (!Role?.findOrCreate || !Plan?.findOrCreate) {
        throw new Error('Database models (Role, Plan) or their methods are not available. Check model definitions and associations in /models.');
    }

    try {
        logger.info('[Seed] Starting database seeding process...');

        // 建立 'user' 角色
        await Role.findOrCreate({
            where: { name: 'user' },
            defaults: { name: 'user' }
        });

        // 建立 'admin' 角色
        await Role.findOrCreate({
            where: { name: 'admin' },
            defaults: { name: 'admin' }
        });
        logger.info('[Seed] User roles checked/created successfully.');

        // 建立 'free_trial' 方案
        await Plan.findOrCreate({
            where: { name: 'free_trial' },
            defaults: {
                name: 'free_trial',
                price: 0.00,
                upload_limit: 1, // 免費上傳 1 次
                scan_limit: 1,   // 免費偵測 1 次
                description: '免費體驗方案，包含一次上傳與侵權偵測。'
            }
        });
        logger.info('[Seed] Free trial plan checked/created successfully.');

        logger.info('[Seed] Database seeding completed successfully.');

    } catch (error) {
        logger.error('[Seed] Error during database seeding:', error);
        throw new Error('Database seeding failed. Server cannot start.');
    }
}

module.exports = { seedDatabase };
