// express/worker.js (最終無 Milvus 版本)
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
        if (!imageBuffer) throw new Error('Failed to retrieve a valid image buffer from IPFS.');

        // --- 步驟 1: 執行外部掃描 ---
        logger.info(`[Worker] Task ${taskId}: Performing external scan (Google, TinEye, Bing)...`);
        const externalScanResults = await scannerService.performFullScan({
            buffer: imageBuffer,
            originalFingerprint: fileRecord.fingerprint,
        });

        // --- 步驟 2: 執行(已停用的)內部向量掃描 ---
        logger.info(`[Worker] Task ${taskId}: Performing internal vector search (currently disabled)...`);
        const internalScanResults = await vectorSearchService.searchLocalImage(imageBuffer);

        // --- 步驟 3: 組合並儲存最終結果 ---
        const finalResults = {
            scan: externalScanResults,
            internalMatches: internalScanResults.matches || [] // 使用來自停用服務的空結果
        };
        
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
