// express/worker.js (最終穩定版)
require('dotenv').config();
const db = require('./models');
const logger = require('../utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const ipfsService = require('./services/ipfsService');
const { getIO, initSocket } = require('./socket');
const express =require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// 初始化 Socket.IO，確保它在伺服器監聽前準備好
initSocket(server);

const WORKER_PORT = process.env.WORKER_PORT || 3001;

async function processScanTask(task) {
    const { taskId, fileId, userId } = task;
    const io = getIO();
    logger.info(`[Worker] Received task ${taskId}: Processing scan for File ID ${fileId}`);
    
    const emitStatus = (status, message, data = {}) => {
        if (userId) {
            io.to(`user_${userId}`).emit('scan_update', { taskId, fileId, status, message, ...data });
        }
    };

    try {
        await db.Scan.update({ status: 'processing', started_at: new Date() }, { where: { id: taskId } });
        emitStatus('processing', '掃描任務已開始處理...');

        const fileRecord = await db.File.findByPk(fileId);
        if (!fileRecord) throw new Error(`File record ${fileId} not found.`);

        emitStatus('processing', '正在從 IPFS 獲取檔案...');
        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        
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
        const errorResult = { error: error.message, stack: error.stack };
        await db.Scan.update({ status: 'failed', completed_at: new Date(), result: JSON.stringify(errorResult) }, { where: { id: taskId } });
        emitStatus('failed', `任務失敗: ${error.message}`);
    }
}

async function startWorker() {
    try {
        logger.info('[Worker] Starting up...');
        await db.sequelize.authenticate();
        logger.info('[Worker] Database connection successful.');

        // 初始化 IPFS 服務 (如果 worker 需要的話)
        ipfsService.init();
        
        logger.info('[Worker] Connecting to message queue...');
        await queueService.connect();
        logger.info('[Worker] Message queue connected. Setting up consumer...');
        
        // 設定消費者來處理任務
        await queueService.consumeTasks(processScanTask);
        logger.info('[Worker] Task consumer is ready.');

        // 啟動伺服器以保持進程存活
        server.listen(WORKER_PORT, () => {
            logger.info(`[Worker] Worker is fully operational and listening on port ${WORKER_PORT}.`);
        });

    } catch (error) {
        logger.error('[Worker] Failed to start worker service:', error);
        process.exit(1);
    }
}

startWorker();
