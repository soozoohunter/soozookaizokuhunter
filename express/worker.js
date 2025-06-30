// express/worker.js (Final Path-Corrected Version)
require('dotenv').config();
// ** FIX: Corrected path from '../models' to './models'
const db = require('./models'); 
const logger = require('./utils/logger');
// ** FIX: Corrected path for all services
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

        // --- Stage 1: Fast External Scan ---
        logger.info(`[Worker] Task ${taskId}: Performing external scan (Google, TinEye, etc.)...`);
        const externalScanResults = await scannerService.performFullScan({
            buffer: imageBuffer,
            originalFingerprint: fileRecord.fingerprint,
        });

        let finalResults = {
            scan: externalScanResults,
            internalMatches: { success: false, error: "Not performed yet." } 
        };
        
        // --- Stage 2: Save intermediate results ---
        logger.info(`[Worker] Task ${taskId}: External scan complete. Saving intermediate results.`);
        await db.Scan.update(
            { result: JSON.stringify(finalResults), status: 'processing' },
            { where: { id: taskId } }
        );

        // --- Stage 3: Slow Internal Vector Scan ---
        logger.info(`[Worker] Task ${taskId}: Performing internal vector search...`);
        try {
            const vectorMatches = await vectorSearchService.searchLocalImage(imageBuffer);
            finalResults.internalMatches = vectorMatches;
            logger.info(`[Worker] Task ${taskId}: Internal vector search completed successfully.`);
        } catch (vectorError) {
            logger.error(`[Worker] Task ${taskId}: Internal vector search FAILED: ${vectorError.message}. This is non-critical.`);
            finalResults.internalMatches = { success: false, error: vectorError.message };
        }

        // --- Stage 4: Save final results and mark the entire task as completed ---
        logger.info(`[Worker] Task ${taskId}: All stages finished. Saving final aggregated results.`);
        const finalStatus = 'completed'; 
        
        await db.Scan.update({ 
            status: finalStatus, 
            completed_at: new Date(),
            result: JSON.stringify(finalResults)
        }, { where: { id: taskId } });
        
        await db.File.update({ 
            status: 'scanned',
            resultJson: JSON.stringify(finalResults)
        }, { where: { id: fileId } });

        logger.info(`[Worker] Task ${taskId}: Successfully processed task for File ID ${fileId}. Final status: ${finalStatus}`);
        return true;

    } catch (error) {
        logger.error(`[Worker] Task ${taskId}: A CRITICAL error occurred, task will be marked as failed. Error: ${error.message}`);
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
        logger.info('[Worker] Database connection established.');
        await queueService.connect();
        queueService.consumeTasks(processScanTask);
        logger.info('[Worker] Ready and waiting for tasks.');
    } catch (error) {
        logger.error('[Worker] Failed to start:', error);
        process.exit(1);
    }
}

startWorker();
