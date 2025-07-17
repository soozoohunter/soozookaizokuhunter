// express/seed.js
const { Plan, Role } = require('./models');
const logger = require('./utils/logger'); // 使用您現有的 logger

async function seedDatabase() {
    try {
        logger.info('[Seed] Starting database seeding process...');

        // 1. 建立使用者角色 (User Roles)
        const [userRole, userCreated] = await Role.findOrCreate({
            where: { name: 'user' },
            defaults: { name: 'user' }
        });
        if (userCreated) logger.info('[Seed] Role "user" created.');

        const [adminRole, adminCreated] = await Role.findOrCreate({
            where: { name: 'admin' },
            defaults: { name: 'admin' }
        });
        if (adminCreated) logger.info('[Seed] Role "admin" created.');

        // 2. 建立免費試用方案 (Free Trial Plan)
        const [freePlan, freeCreated] = await Plan.findOrCreate({
            where: { name: 'free_trial' },
            defaults: {
                name: 'free_trial',
                price: 0.00,
                upload_limit: 1, // 免費上傳 1 次
                scan_limit: 1,   // 免費偵測 1 次
                description: '免費體驗方案，包含一次上傳與侵權偵測。'
            }
        });
        if (freeCreated) logger.info('[Seed] Plan "free_trial" created.');

        // 3. 建立付費方案 (您可以取消註解或修改以符合您的需求)
        /*
        const [basicPlan, basicCreated] = await Plan.findOrCreate({
            where: { name: 'basic' },
            defaults: {
                name: 'basic',
                price: 490.00,
                upload_limit: 50,
                scan_limit: 50,
                description: '基礎方案，適合個人創作者。'
            }
        });
        if (basicCreated) logger.info('[Seed] Plan "basic" created.');
        */

        logger.info('[Seed] Database seeding completed successfully.');

    } catch (error) {
        logger.error('[Seed] Error during database seeding:', error);
        // 在生產環境中，如果 seeding 失敗，應該拋出錯誤讓應用程式停止啟動
        throw new Error('Database seeding failed. Server cannot start.');
    }
}

module.exports = { seedDatabase };
