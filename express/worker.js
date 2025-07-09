// express/worker.js (終極偵錯版 - 完整程式碼)
console.log('[Worker-Tracer] File start. Loading dotenv...');
require('dotenv').config();
console.log('[Worker-Tracer] dotenv loaded.');

// 全域錯誤捕獲，強迫任何未處理的錯誤現形
process.on('uncaughtException', (err, origin) => {
    console.error(`[Worker-Tracer] FATAL: Uncaught Exception. Origin: ${origin}, Error:`, err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Worker-Tracer] FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

console.log('[Worker-Tracer] Loading modules...');
const http = require('http');
const express = require('express');
const db = require('./models');
const logger = require('./utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const ipfsService = require('./services/ipfsService');
const { initSocket, getIO } = require('./socket');
console.log('[Worker-Tracer] All modules loaded.');

const app = express();
const server = http.createServer(app);
initSocket(server);

const WORKER_PORT = process.env.WORKER_PORT || 3001;

/**
 * 處理單一掃描任務的完整函式
 * @param {object} task - 從 RabbitMQ 接收的任務物件
 */
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
        if (!fileRecord) {
            throw new Error(`File record ${fileId} not found for task ${taskId}.`);
        }

        emitStatus('processing', '正在從 IPFS 獲取檔案...');
        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        if (!imageBuffer) {
            throw new Error(`Failed to get file from IPFS with hash ${fileRecord.ipfs_hash}.`);
        }
        
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

// 使用 IIFE (立即調用函式表達式) 來啟動，並在每一步都加上追蹤日誌
(async () => {
    try {
        logger.info('[Worker-Tracer] Startup sequence initiated.');

        await db.sequelize.authenticate();
        logger.info('[Worker-Tracer] >>> STEP 1/4: Database connection verified.');
        
        ipfsService.init();
        logger.info('[Worker-Tracer] >>> STEP 2/4: IPFS client initialized.');

        await queueService.connect();
        logger.info('[Worker-Tracer] >>> STEP 3/4: RabbitMQ connected.');
        
        await queueService.consumeTasks(processScanTask);
        logger.info('[Worker-Tracer] >>> STEP 4/4: Task consumer is ready.');

        server.listen(WORKER_PORT, () => {
            logger.info(`[Worker-Tracer] FINAL: Service is fully operational on port ${WORKER_PORT}.`);
        });

    } catch (error) {
        logger.error('[Worker-Tracer] FATAL STARTUP ERROR:', error);
        process.exit(1);
    }
})();
