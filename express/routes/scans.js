// express/routes/scans.js (完整修正版)
const express = require('express');
const router = express.Router();
const db = require('../models');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

/**
 * GET /api/scans/status/:scanId
 * Checks the status and result of a specific scan task.
 * This is the primary endpoint for the frontend to poll for scan results.
 */
router.get('/status/:scanId', async (req, res) => {
    // [關鍵修正] 將參數從 taskId 改為 scanId，以匹配前端的 API 呼叫
    const { scanId } = req.params;

    if (!scanId) {
        return res.status(400).json({ error: 'Scan ID is required.' });
    }

    try {
        // 使用 snake_case 查詢資料庫，確保欄位名與 DB schema 一致
        const scan = await db.Scan.findByPk(scanId, {
            attributes: ['id', 'status', 'progress', 'result', 'created_at', 'completed_at', 'file_id']
        });

        if (!scan) {
            return res.status(404).json({ error: `Scan task with ID ${scanId} not found.` });
        }

        let result = scan.result;
        // 確保 result 永遠是物件，避免前端解析錯誤
        if (typeof result === 'string') {
            try { 
                result = JSON.parse(result); 
            } catch (e) { 
                logger.warn(`[Scan Status] Could not parse result JSON for scan ${scanId}`);
                result = { error: 'Result format from DB is invalid.' }; 
            }
        }

        // [優化] 回傳給前端的欄位名統一為 camelCase，這是 JavaScript 的通用慣例
        res.status(200).json({
            id: scan.id,
            fileId: scan.file_id,
            status: scan.status,
            progress: scan.progress,
            result: result || {}, // 確保 result 即使為 null 也回傳空物件
            createdAt: scan.created_at,
            completedAt: scan.completed_at
        });

    } catch (error) {
        logger.error(`[Scan Status API] Failed to get status for task ID ${scanId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve scan status.' });
    }
});


/**
 * POST /api/scans/:fileId
 * Re-dispatches a scan task for a specific file.
 * This can be used for manual re-scanning from the user dashboard.
 */
router.post('/:fileId', auth, async (req, res) => {
    const { fileId } = req.params;
    const userId = req.user.id; // 從 auth 中介軟體獲取

    if (!fileId) {
        return res.status(400).json({ error: '缺少檔案ID參數' });
    }

    try {
        const file = await db.File.findOne({ where: { id: fileId, user_id: userId } });
        if (!file) {
            return res.status(404).json({ error: '找不到對應的檔案紀錄或權限不足' });
        }

        const scan = await db.Scan.create({
            file_id: file.id,
            user_id: userId,
            status: 'pending'
        });

        await db.UsageRecord.create({ user_id: userId, feature_code: 'scan' });

        // 將所有需要的資訊都發送到佇列
        await queueService.sendToQueue({
            taskId: scan.id,
            fileId: file.id,
            userId: userId,
            ipfsHash: file.ipfs_hash,
            fingerprint: file.fingerprint,
            keywords: file.keywords,
        });

        res.status(202).json({ message: '掃描任務已重新派發', scanId: scan.id });
    } catch (err) {
        logger.error(`[Scan API] Failed to re-dispatch scan task for file ${fileId}:`, err);
        res.status(500).json({ error: '無法派發掃描任務' });
    }
});


module.exports = router;
