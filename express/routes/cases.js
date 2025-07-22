const express = require('express');
const router = express.Router();
const { InfringementCase, File } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

router.get('/', auth, async (req, res) => {
    try {
        const cases = await InfringementCase.findAll({
            where: { user_id: req.user.id },
            include: { model: File, attributes: ['id', 'filename', 'thumbnail_path'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(cases);
    } catch (error) {
        res.status(500).json({ message: '無法獲取案件列表' });
    }
});

router.post('/create', auth, async (req, res) => {
    const { fileId, infringingUrl } = req.body;
    if (!fileId || !infringingUrl) {
        return res.status(400).json({ message: '缺少 File ID 或侵權網址' });
    }
    try {
        const file = await File.findOne({ where: { id: fileId, user_id: req.user.id } });
        if (!file) return res.status(403).json({ message: '權限不足或找不到該檔案' });

        const newCase = await InfringementCase.create({
            user_id: req.user.id,
            file_id: fileId,
            infringing_url: infringingUrl
        });
        logger.info(`[Case] User ${req.user.id} created new case ${newCase.id} for URL: ${infringingUrl}`);
        res.status(201).json(newCase);
    } catch (error) {
        logger.error('[Case] Error creating case:', error);
        res.status(500).json({ message: '建立案件時發生錯誤' });
    }
});

module.exports = router;
