// express/worker.js (Stage 1 Debugging: DB Connection Only)
require('dotenv').config();

// 全域錯誤捕獲
process.on('uncaughtException', (err, origin) => {
    console.error(`[Worker] FATAL: Uncaught Exception. Origin: ${origin}, Error:`, err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Worker] FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const logger = require('./utils/logger');
const db = require('./models');

async function start() {
    try {
        logger.info('[Worker-Debug] STAGE 1: Attempting to start...');
        
        await db.sequelize.authenticate();
        logger.info('[Worker-Debug] STAGE 1: Database connection verified successfully!');

        // 讓進程保持運行
        logger.info('[Worker-Debug] STAGE 1: Worker is now stable and idle. Press Ctrl+C to stop.');
        setInterval(() => {}, 1 << 30); 

    } catch (error) {
        logger.error('[Worker-Debug] STAGE 1: Fatal startup error:', error);
        process.exit(1);
    }
}

start();
