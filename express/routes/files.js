// express/routes/files.js
const express = require('express');
const router = express.Router();
const { File, Scan } = require('../models');
const auth = require('../middleware/auth');

// GET /api/files/:id - 獲取單一檔案的詳細資訊及其所有掃描紀錄
router.get('/:id', auth, async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;

        const file = await File.findOne({
            where: { id: fileId, user_id: userId },
            include: [{
                model: Scan,
                as: 'scans',
                order: [['createdAt', 'DESC']]
            }],
            order: [[{ model: Scan, as: 'scans' }, 'createdAt', 'DESC']]
        });

        if (!file) {
            return res.status(404).json({ error: 'File not found or access denied.' });
        }

        const fileData = file.toJSON();
        if (fileData.thumbnail_path) {
            const baseUrl = process.env.PUBLIC_HOST || req.protocol + '://' + req.get('host');
            fileData.thumbnailUrl = `${baseUrl}${file.thumbnail_path}`;
        }

        res.json(fileData);
    } catch (error) {
        console.error(`[File Detail API Error] Failed to fetch details for file ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to load file data.' });
    }
});

module.exports = router;
