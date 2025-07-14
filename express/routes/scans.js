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
        const scan = await db.Scan.findByPk(taskId, {
            attributes: ['id','status','result','createdAt','completed_at','file_id']
        });

        if (!scan) {
            return res.status(404).json({ error: `Scan task with ID ${taskId} not found.` });
        }

        let result = scan.result;
        if (typeof result === 'string') {
            try { result = JSON.parse(result); } catch (e) { result = { error: 'Result format invalid' }; }
        }
        res.status(200).json({
            id: scan.id,
            status: scan.status,
            result,
            createdAt: scan.createdAt,
            completed_at: scan.completed_at
        });

    } catch (error) {
        logger.error(`[Scan Status API] Failed to get status for task ID ${taskId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve scan status.' });
    }
});

module.exports = router;
