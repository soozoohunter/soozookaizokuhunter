const logger = require('./utils/logger');
// [★★ 關鍵修正 ★★] 導入整個 db 物件，而不是解構
const db = require('./models');

async function seedDatabase() {
    try {
        logger.info('[Seed] Starting database seeding process...');

        // [★★ 關鍵修正 ★★] 使用 db.Role 和 db.Plan 來操作模型
        await db.Role.findOrCreate({
            where: { name: 'user' },
            defaults: { name: 'user' }
        });
        await db.Role.findOrCreate({
            where: { name: 'admin' },
            defaults: { name: 'admin' }
        });
        logger.info('[Seed] User roles checked/created successfully.');

        await db.Plan.findOrCreate({
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

        // 您未來可以在此處新增付費方案
        // await db.Plan.findOrCreate({ ... });

        logger.info('[Seed] Database seeding completed successfully.');

    } catch (error) {
        logger.error('[Seed] Error during database seeding:', error);
        throw new Error('Database seeding failed. Server cannot start.');
    }
}

module.exports = { seedDatabase };
