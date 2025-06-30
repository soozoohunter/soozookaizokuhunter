// express/worker.js (Final Corrected Version)
require('dotenv').config();
const db = require('./models');
const logger = require('./utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const { Scan, File } = require('./models');
const ipfsService = require('./services/ipfsService');
const vectorSearchService = require('./services/vectorSearch');

async function processScanTask(task) {
    const { taskId, fileId } = task;
    logger.info(`[Worker] Received task ${taskId}: Processing scan for File ID ${fileId}`);

    let scanRecord;
    try {
        scanRecord = await Scan.findByPk(taskId);
        if (!scanRecord) {
            throw new Error(`Scan task with ID ${taskId} not found.`);
        }
        await scanRecord.update({ status: 'processing', started_at: new Date() });

        const fileRecord = await File.findByPk(fileId);
        if (!fileRecord) {
            throw new Error(`File record with ID ${fileId} not found.`);
        }

        logger.info(`[Worker] Task ${taskId}: Retrieving image from IPFS with hash ${fileRecord.ipfs_hash}`);
        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        
        // This is a critical check to ensure we have a valid buffer before proceeding.
        if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
            throw new Error('Failed to retrieve a valid image buffer from IPFS.');
        }

        logger.info(`[Worker] Task ${taskId}: Performing full scan...`);
        
        // **FIX**: Ensure we pass the options object correctly.
        const scanResults = await scannerService.performFullScan({
            buffer: imageBuffer,
            originalFingerprint: fileRecord.fingerprint,
        });

        logger.info(`[Worker] Task ${taskId}: Performing internal vector search...`);
        const vectorMatches = await vectorSearchService.searchLocalImage(imageBuffer);

        const finalResults = {
            scan: scanResults,
            internalMatches: vectorMatches
        };
        
        logger.info(`[Worker] Task ${taskId}: Scan complete. Saving results to database.`);
        fileRecord.status = 'scanned';
        fileRecord.resultJson = JSON.stringify(finalResults);
        await fileRecord.save();

        await scanRecord.update({ 
            status: 'completed', 
            completed_at: new Date(),
            result: JSON.stringify(finalResults)
        });

        logger.info(`[Worker] Task ${taskId}: Successfully processed scan for File ID ${fileId}.`);
        return true;

    } catch (error) {
        logger.error(`[Worker] Task ${taskId}: FAILED to process scan for File ID ${fileId}. Error: ${error.message}`);
        logger.error(error.stack);
        if (scanRecord) {
            await scanRecord.update({
                status: 'failed',
                completed_at: new Date(),
                result: JSON.stringify({ error: error.message })
            });
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
