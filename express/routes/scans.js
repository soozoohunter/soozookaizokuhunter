const express = require('express');
const router = express.Router();
const db = require('../models');
const logger = require('../utils/logger');

/**
 * GET /api/scans/status/:taskId
 * Checks the status and result of a specific scan task.
 */
router.get('/status/:taskId', async (req, res) => {
    const { taskId } = req.params;

    if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required.' });
    }

    try {
        const scan = await db.Scan.findByPk(taskId);

        if (!scan) {
            return res.status(404).json({ error: `Scan task with ID ${taskId} not found.` });
        }

        res.status(200).json({
            taskId: scan.id,
            fileId: scan.file_id,
            status: scan.status,
            result: scan.result,
            createdAt: scan.createdAt,
            completedAt: scan.completed_at,
        });

    } catch (error) {
        logger.error(`[Scan Status API] Failed to get status for task ID ${taskId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve scan status.' });
    }
});

module.exports = router;
