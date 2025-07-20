const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

// GET /api/files/:id/certificate
router.get('/:id/certificate', fileController.downloadCertificate);

module.exports = router;
