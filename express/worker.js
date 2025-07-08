// express/worker.js (最終啟動邏輯修正版)
require('dotenv').config();
const db = require('./models');
const logger = require('../utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const ipfsService = require('./services/ipfsService');
const { getIO, initSocket } = require('./socket');
const express = require('express');
const http = require('http');

// 輕量級的 Express Server，僅用於初始化 Socket.IO
const app = express();
const server = http.createServer(app);
initSocket(server);

async function processScanTask(task) {
    const { taskId, fileId, userId } = task;
    const io = getIO();

    const emitStatus = (status, message, data = {}) => {
        if (userId) {
            io.to(`user_${userId}`).emit('scan_update', { taskId, fileId, status, message, ...data });
        }
    };

    logger.info(`[Worker] Received task ${taskId}: Processing scan for File ID ${fileId} for user ${userId}`);
    emitStatus('processing', '掃描任務已開始...');

    try {
        await db.Scan.update({ status: 'processing', started_at: new Date() }, { where: { id: taskId } });

        const fileRecord = await db.File.findByPk(fileId);
        if (!fileRecord) throw new Error(`File record ${fileId} not found.`);

        emitStatus('processing', '正在從 IPFS 獲取檔案...');
        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        
        emitStatus('processing', '正在執行全網路反向圖搜...');
        const scanResult = await scannerService.scanByImage(imageBuffer, {
            fingerprint: fileRecord.fingerprint,
        });
        
        const finalStatus = scanResult.errors.length > 0 ? 'failed' : 'completed';
        
        await db.Scan.update({ 
            status: finalStatus, 
            completed_at: new Date(),
            result: JSON.stringify(scanResult)
        }, { where: { id: taskId } });
        
        logger.info(`[Worker] Task ${taskId}: Successfully processed. Final status: ${finalStatus}`);
        emitStatus(finalStatus, '掃描完成！', { results: scanResult });
        return true;

    } catch (error) {
        logger.error(`[Worker] Task ${taskId}: CRITICAL error occurred: ${error.message}`);
        await db.Scan.update({ status: 'failed', completed_at: new Date(), result: JSON.stringify({ error: error.message }) }, { where: { id: taskId } });
        emitStatus('failed', `任務失敗: ${error.message}`);
        return false;
    }
}

async function startWorker() {
    try {
        logger.info('[Worker] Starting up...');
        await db.sequelize.authenticate();
        logger.info('[Worker] Database connection established.');
        
        // [FIX] 確保 RabbitMQ 連線成功後，再設定消費者
        await queueService.connect();
        await queueService.consumeTasks(processScanTask);
        
        logger.info('[Worker] Ready and waiting for tasks.');
    } catch (error) {
        logger.error('[Worker] Failed to start:', error);
        process.exit(1);
    }
}

startWorker();
