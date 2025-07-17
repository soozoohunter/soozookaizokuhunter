const logger = require('./utils/logger');

// [★★ 關鍵修正 1 ★★] 函式接收一個 db 物件作為參數，而不是自己導入
async function seedDatabase(db) {
    // 檢查傳入的 db 物件和模型是否存在，增加防呆機制
    if (!db || !db.Role || !db.Plan) {
        throw new Error('Database models (Role, Plan) are not available in the passed db object.');
    }

    try {
        logger.info('[Seed] Starting database seeding process...');

        // [★★ 關鍵修正 2 ★★] 使用傳入的 db 物件來操作模型
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
                upload_limit: 1,
                scan_limit: 1,
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
