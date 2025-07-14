require('dotenv').config();

process.on('uncaughtException', (err, origin) => { 
    console.error(`[WORKER FATAL] Uncaught Exception at: ${origin}`, err); 
    process.exit(1); 
});
process.on('unhandledRejection', (reason, promise) => { 
    console.error('[WORKER FATAL] Unhandled Rejection at:', promise, 'reason:', reason); 
    process.exit(1); 
});

const http = require('http');
const express = require('express');
const db = require('./models');
const logger = require('./utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const ipfsService = require('./services/ipfsService');

const app = express();
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
const server = http.createServer(app);

const WORKER_PORT = process.env.WORKER_PORT || 3001;

async function processScanTask(task) {
    const { taskId, fileId, userId } = task;
    logger.info(`[Worker] Received task ${taskId}: Processing scan for File ID ${fileId}`);

    try {
        await db.Scan.update({ status: 'processing', progress: 10, started_at: new Date() }, { where: { id: taskId } });

        const fileRecord = await db.File.findByPk(fileId);
        if (!fileRecord) throw new Error(`File record ${fileId} not found in DB.`);

        await db.Scan.update({ progress: 20 }, { where: { id: taskId } });

        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        if (!imageBuffer) throw new Error(`Failed to get file from IPFS with hash ${fileRecord.ipfs_hash}.`);

        await db.Scan.update({ progress: 40 }, { where: { id: taskId } });

        const scanResult = await scannerService.scanByImage(imageBuffer, {
            fingerprint: fileRecord.fingerprint,
            keywords: fileRecord.keywords,
        });

        await db.Scan.update({ progress: 80 }, { where: { id: taskId } });

        const finalStatus = 'completed';

        await db.Scan.update({
            status: finalStatus,
            completed_at: new Date(),
            progress: 100,
            result: {
                results: scanResult.results || {},
                errors: scanResult.errors || []
            }
        }, { where: { id: taskId } });

        logger.info(`[Worker] Task ${taskId} completed successfully.`);
        return true;

    } catch (error) {
        logger.error(`[Worker] Task ${taskId} CRITICAL error:`, { message: error.message, stack: error.stack });
        await db.Scan.update({
            status: 'failed',
            completed_at: new Date(),
            progress: 100,
            result: { error: error.message }
        }, { where: { id: taskId } });
        return true;
    }
}

(async () => {
    try {
        logger.info('[Worker] Startup sequence initiated.');
        await db.sequelize.authenticate();
        logger.info('[Worker] Database connection verified.');
        await queueService.connect();
        await queueService.consumeTasks(processScanTask);
        app.listen(WORKER_PORT, () => {
            logger.info(`[Worker] Service is fully operational, health check on port ${WORKER_PORT}.`);
        });
    } catch (error) {
        logger.error('[Worker] FATAL STARTUP ERROR:', error);
        process.exit(1);
    }
})();
