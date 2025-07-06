require('dotenv').config();
const db = require('./models');
const logger = require('./utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const ipfsService = require('./services/ipfsService');
const { getIO, initSocket } = require('./socket');

async function processScanTask(task) {
    const { taskId, fileId, userId } = task;
    const io = getIO();

    const emitStatus = (status, message, data = {}) => {
        io.to(`user_${userId}`).emit('scan_update', { taskId, fileId, status, message, ...data });
    };

    logger.info(`[Worker] Received task ${taskId}: Processing scan for File ID ${fileId}`);
    emitStatus('processing', '掃描任務已開始處理...');

    try {
        await db.Scan.update({ status: 'processing', started_at: new Date() }, { where: { id: taskId } });

        const fileRecord = await db.File.findByPk(fileId);
        if (!fileRecord) throw new Error(`File record with ID ${fileId} not found.`);

        emitStatus('processing', '正在從 IPFS 獲取檔案...');
        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        if (!imageBuffer) throw new Error('Failed to retrieve a valid image buffer from IPFS.');
        
        emitStatus('processing', '正在執行外部反向圖搜...');
        const externalScanResults = await scannerService.performFullScan({
            buffer: imageBuffer,
            originalFingerprint: fileRecord.fingerprint,
        });

        const finalResults = { scan: externalScanResults, internalMatches: [] };
        const finalStatus = 'completed';
        
        await db.Scan.update({ 
            status: finalStatus, 
            completed_at: new Date(),
            result: JSON.stringify(finalResults)
        }, { where: { id: taskId } });
        
        logger.info(`[Worker] Task ${taskId}: Successfully processed. Final status: ${finalStatus}`);
        emitStatus('completed', '掃描完成！', { results: finalResults });
        return true;

    } catch (error) {
        logger.error(`[Worker] Task ${taskId}: CRITICAL error occurred: ${error.message}`);
        const finalStatus = 'failed';
        await db.Scan.update({ status: finalStatus, completed_at: new Date(), result: JSON.stringify({ error: error.message }) }, { where: { id: taskId } });
        emitStatus('failed', `任務失敗: ${error.message}`);
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

const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
initSocket(server);

startWorker();
