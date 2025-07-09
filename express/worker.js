// express/worker.js (最終生產版)
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

const http = require('http');
const express = require('express');
const db = require('./models');
const logger = require('../utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const ipfsService = require('./services/ipfsService');
const { initSocket, getIO } = require('./socket');

const app = express();
const server = http.createServer(app);
initSocket(server);

const WORKER_PORT = process.env.WORKER_PORT || 3001;

async function processScanTask(task) {
    const { taskId, fileId, userId } = task;
    const io = getIO();
    logger.info(`[Worker] Received task ${taskId}: Processing scan for File ID ${fileId}`);
    
    const emitStatus = (status, message, data = {}) => {
        if (userId) io.to(`user_${userId}`).emit('scan_update', { taskId, fileId, status, message, ...data });
    };

    try {
        await db.Scan.update({ status: 'processing', started_at: new Date() }, { where: { id: taskId } });
        emitStatus('processing', '掃描任務已開始...');

        const fileRecord = await db.File.findByPk(fileId);
        if (!fileRecord) throw new Error(`File record ${fileId} not found for task ${taskId}.`);

        emitStatus('processing', '正在從 IPFS 獲取檔案...');
        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        if (!imageBuffer) throw new Error(`Failed to get file from IPFS with hash ${fileRecord.ipfs_hash}.`);
        
        emitStatus('processing', '正在執行全網路反向圖搜...');
        const scanResult = await scannerService.scanByImage(imageBuffer, { fingerprint: fileRecord.fingerprint });
        
        const finalStatus = (scanResult.errors && scanResult.errors.length > 0) ? 'failed' : 'completed';
        
        await db.Scan.update({ 
            status: finalStatus, 
            completed_at: new Date(),
            result: JSON.stringify(scanResult || { errors: ['No result from scanner'] })
        }, { where: { id: taskId } });
        
        logger.info(`[Worker] Task ${taskId} completed with status: ${finalStatus}`);
        emitStatus(finalStatus, '掃描完成！', { results: scanResult });

    } catch (error) {
        logger.error(`[Worker] Task ${taskId} CRITICAL error:`, error);
        await db.Scan.update({ 
            status: 'failed', 
            completed_at: new Date(), 
            result: JSON.stringify({ error: error.message, stack: error.stack }) 
        }, { where: { id: taskId } });
        emitStatus('failed', `任務失敗: ${error.message}`);
    }
}

async function start() {
    try {
        logger.info('[Worker] Service starting...');
        await db.sequelize.authenticate();
        logger.info('[Worker] Database connection verified.');
        
        ipfsService.init();
        logger.info('[Worker] IPFS client initialized.');

        await queueService.connect();
        await queueService.consumeTasks(processScanTask);
        logger.info('[Worker] Now consuming tasks from queue.');

        server.listen(WORKER_PORT, () => {
            logger.info(`[Worker] Service is fully operational. Listening on port ${WORKER_PORT}.`);
        });

    } catch (error) {
        logger.error('[Worker] Fatal startup error:', error);
        process.exit(1);
    }
}

start();
