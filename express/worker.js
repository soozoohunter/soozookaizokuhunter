// express/worker.js (Final Optimized Version)
require('dotenv').config();
const db = require('./models');
const logger = require('./utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const ipfsService = require('./services/ipfsService');
const vectorSearchService = require('./services/vectorSearch');

async function processScanTask(task) {
    const { taskId, fileId } = task;
    logger.info(`[Worker] Received task ${taskId}: Processing scan for File ID ${fileId}`);

    let scanRecord;
    try {
        scanRecord = await db.Scan.findByPk(taskId);
        if (!scanRecord) throw new Error(`Scan task with ID ${taskId} not found.`);
        await scanRecord.update({ status: 'processing', started_at: new Date() });

        const fileRecord = await db.File.findByPk(fileId);
        if (!fileRecord) throw new Error(`File record with ID ${fileId} not found.`);

        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
            throw new Error('Failed to retrieve a valid image buffer from IPFS.');
        }

        // --- Step 1: Fast External Scan ---
        logger.info(`[Worker] Task ${taskId}: Performing FAST external scan...`);
        const externalScanResults = await scannerService.performFullScan({
            buffer: imageBuffer,
            originalFingerprint: fileRecord.fingerprint,
        });
        
        let finalResults = {
            scan: externalScanResults,
            internalMatches: null
        };
        
        // --- Step 2: Save FIRST results to DB ---
        // Now the frontend can already see the potential links!
        logger.info(`[Worker] Task ${taskId}: External scan complete. Saving initial results.`);
        await db.Scan.update(
            { result: JSON.stringify(finalResults) },
            { where: { id: taskId } }
        );

        // --- Step 3: Slow Internal Vector Scan ---
        logger.info(`[Worker] Task ${taskId}: Performing SLOW internal vector search...`);
        try {
            const vectorMatches = await vectorSearchService.searchLocalImage(imageBuffer);
            finalResults.internalMatches = vectorMatches;
            logger.info(`[Worker] Task ${taskId}: Internal vector search completed.`);
        } catch (vectorError) {
            logger.error(`[Worker] Task ${taskId}: Internal vector search FAILED. Error: ${vectorError.message}`);
            finalResults.internalMatches = { success: false, error: vectorError.message };
        }

        // --- Step 4: Save FINAL results and mark as completed ---
        logger.info(`[Worker] Task ${taskId}: All scans finished. Saving final results.`);
        await db.Scan.update(
            {
                status: 'completed',
                completed_at: new Date(),
                result: JSON.stringify(finalResults)
            },
            { where: { id: taskId } }
        );
        await db.File.update(
            {
                status: 'scanned',
                resultJson: JSON.stringify(finalResults)
            },
            { where: { id: fileId } }
        );

        logger.info(`[Worker] Task ${taskId}: Successfully processed all scans for File ID ${fileId}.`);
        return true;

    } catch (error) {
        logger.error(`[Worker] Task ${taskId}: A critical error occurred. Error: ${error.message}`);
        logger.error(error.stack);
        if (scanRecord) {
            await db.Scan.update({
                status: 'failed',
                completed_at: new Date(),
                result: JSON.stringify({ error: error.message })
            }, { where: { id: taskId } });
        }
        return false;
    }
}

async function startWorker() {
    try {
        logger.info('[Worker] Starting up...');
        await db.sequelize.authenticate();
        logger.info('[Worker] Database connection has been established successfully.');
        await queueService.connect();

        queueService.consumeTasks(processScanTask);
        logger.info('[Worker] Worker is running and waiting for tasks. To exit press CTRL+C');

    } catch (error) {
        logger.error('[Worker] Failed to start:', error);
        process.exit(1);
    }
}

startWorker();
