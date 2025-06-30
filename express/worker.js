// express/worker.js
// This is the background worker process that consumes tasks from RabbitMQ.

// Initialize all services and database connections first.
require('dotenv').config();
const db = require('./models');
const logger = require('./utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const { ScanTask, File } = require('./models');
const ipfsService = require('./services/ipfsService');
const vectorSearchService = require('./services/vectorSearch');

async function processScanTask(task) {
    const { taskId, fileId } = task;
    logger.info(`[Worker] Received task ${taskId}: Processing scan for File ID ${fileId}`);

    let scanRecord;
    try {
        // 1. Find the scan task record and file record from the database
        scanRecord = await ScanTask.findByPk(taskId);
        if (!scanRecord) {
            throw new Error(`Scan task with ID ${taskId} not found.`);
        }
        await scanRecord.update({ status: 'PROCESSING', started_at: new Date() });

        const fileRecord = await File.findByPk(fileId);
        if (!fileRecord) {
            throw new Error(`File record with ID ${fileId} not found.`);
        }

        // 2. Retrieve the image buffer from IPFS
        logger.info(`[Worker] Task ${taskId}: Retrieving image from IPFS with hash ${fileRecord.ipfs_hash}`);
        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        if (!imageBuffer) {
            throw new Error('Failed to retrieve image from IPFS.');
        }

        // 3. Perform the full scan
        logger.info(`[Worker] Task ${taskId}: Performing full scan...`);
        const scanResults = await scannerService.performFullScan({
            buffer: imageBuffer,
            originalFingerprint: fileRecord.fingerprint,
        });

        // 4. Perform internal vector search (if needed, or combine with main scan)
        logger.info(`[Worker] Task ${taskId}: Performing internal vector search...`);
        const vectorMatches = await vectorSearchService.searchLocalImage(imageBuffer);

        const finalResults = {
            scan: scanResults,
            internalMatches: vectorMatches
        };

        // 5. Update the file and scan records with the results
        logger.info(`[Worker] Task ${taskId}: Scan complete. Saving results to database.`);
        fileRecord.status = 'scanned';
        fileRecord.resultJson = JSON.stringify(finalResults);
        await fileRecord.save();

        await scanRecord.update({
            status: 'COMPLETED',
            completed_at: new Date(),
            result_json: finalResults
        });

        logger.info(`[Worker] Task ${taskId}: Successfully processed scan for File ID ${fileId}.`);
        return true; // Acknowledge the message

    } catch (error) {
        logger.error(`[Worker] Task ${taskId}: FAILED to process scan for File ID ${fileId}. Error: ${error.message}`);
        logger.error(error.stack);
        if (scanRecord) {
            await scanRecord.update({
                status: 'FAILED',
                completed_at: new Date(),
                error_message: error.message
            });
        }
        return false; // Reject the message (or requeue based on strategy)
    }
}

async function startWorker() {
    try {
        logger.info('[Worker] Starting up...');
        await db.connectToDatabase();
        logger.info('[Worker] Database connection has been established successfully.');
        await queueService.connect();
        logger.info('[Worker] RabbitMQ connection has been established successfully.');

        // Start consuming tasks from the 'scan_queue'
        queueService.consumeTasks(processScanTask);
        logger.info('[Worker] Worker is running and waiting for tasks. To exit press CTRL+C');

    } catch (error) {
        logger.error('[Worker] Failed to start:', error);
        process.exit(1);
    }
}

startWorker();
