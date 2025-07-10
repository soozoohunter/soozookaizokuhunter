// express/worker.js (v3.0 - Final Production Version)
require('dotenv').config();

process.on('uncaughtException', (err, origin) => { console.error(`[FATAL] Uncaught Exception at: ${origin}`, err); process.exit(1); });
process.on('unhandledRejection', (reason, promise) => { console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason); process.exit(1); });

const http = require('http');
const express = require('express');
const db = require('./models');
const logger = require('./utils/logger');
const queueService = require('./services/queue.service');
const scannerService = require('./services/scanner.service');
const ipfsService = require('./services/ipfsService');
const { initSocket, getIO } = require('./socket');

const app = express();
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
const server = http.createServer(app);
initSocket(server);

const WORKER_PORT = process.env.WORKER_PORT || 3001;

async function processScanTask(task) {
    const { taskId, fileId, userId, keywords } = task;
    const io = getIO();
    logger.info(`[Worker] Received task ${taskId}: Processing scan for File ID ${fileId}`);
    
    const emitStatus = (status, message, data = {}) => {
        if (userId) io.to(`user_${userId}`).emit('scan_update', { taskId, fileId, status, message, ...data });
    };

    try {
        await db.Scan.update({ status: 'processing', started_at: new Date() }, { where: { id: taskId } });
        emitStatus('processing', '掃描任務已開始...');

        const fileRecord = await db.File.findByPk(fileId);
        if (!fileRecord) throw new Error(`File record ${fileId} not found.`);

        emitStatus('processing', '正在從 IPFS 獲取檔案...');
        const imageBuffer = await ipfsService.getFile(fileRecord.ipfs_hash);
        if (!imageBuffer) throw new Error(`Failed to get file from IPFS with hash ${fileRecord.ipfs_hash}.`);
        
        emitStatus('processing', '正在執行全網路反向圖搜...');
        const scanResult = await scannerService.scanByImage(imageBuffer, { 
            fingerprint: fileRecord.fingerprint,
            keywords: keywords,
        });
        
        const finalStatus = 'completed';
        
        await db.Scan.update({ 
            status: finalStatus, 
            completed_at: new Date(),
            result: scanResult
        }, { where: { id: taskId } });
        
        logger.info(`[Worker] Task ${taskId} completed with status: ${finalStatus}`);
        emitStatus(finalStatus, '掃描完成！', { results: scanResult });
        return true;

    } catch (error) {
        logger.error(`[Worker] Task ${taskId} CRITICAL error:`, error);
        await db.Scan.update({ 
            status: 'failed', 
            completed_at: new Date(), 
            result: { error: error.message, stack: error.stack } 
        }, { where: { id: taskId } });
        emitStatus('failed', `任務失敗: ${error.message}`);
        return true; 
    }
}

(async () => {
    try {
        logger.info('[Worker-Tracer] Startup sequence initiated.');
        await db.sequelize.authenticate();
        logger.info('[Worker-Tracer] Database connection verified.');
        ipfsService.init();
        await queueService.connect();
        await queueService.consumeTasks(processScanTask);
        server.listen(WORKER_PORT, () => {
            logger.info(`[Worker-Tracer] Service is fully operational on port ${WORKER_PORT}.`);
        });
    } catch (error) {
        logger.error('[Worker-Tracer] FATAL STARTUP ERROR:', error);
        process.exit(1);
    }
})();
