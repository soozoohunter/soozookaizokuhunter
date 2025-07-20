const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { File } = require('../models');

router.get('/:id/certificate', async (req, res) => {
    try {
        const file = await File.findByPk(req.params.id);
        if (!file || !file.certificate_path) return res.status(404).end();
        return res.sendFile(path.resolve(file.certificate_path));
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve certificate.' });
    }
});

module.exports = router;
