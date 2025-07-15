// routes/scan.js (queue-based version)
const express = require('express');
const router = express.Router();
const { File, Scan, UsageRecord } = require('../models');
const queueService = require('../services/queue.service');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

// 重新派發指定檔案的掃描任務
router.get('/:fileId', auth, async (req, res) => {
    const { fileId } = req.params;
    if (!fileId) return res.status(400).json({ error: '缺少檔案ID參數' });

    try {
        const file = await File.findByPk(fileId);
        if (!file) return res.status(404).json({ error: '找不到對應的檔案紀錄' });

        const scan = await Scan.create({ file_id: file.id, status: 'pending' });
        await UsageRecord.create({ user_id: file.user_id, feature_code: 'scan' });

        await queueService.sendToQueue({
            scanId: scan.id,
            fileId: file.id,
            userId: file.user_id,
            ipfsHash: file.ipfs_hash,
            fingerprint: file.fingerprint,
        });

        res.status(202).json({ message: '掃描任務已派發', scanId: scan.id });
    } catch (err) {
        logger.error('[Scan API] Failed to dispatch scan task:', err);
        res.status(500).json({ error: '無法派發掃描任務' });
    }
});

module.exports = router;
