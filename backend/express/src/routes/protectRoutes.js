const express = require('express');
const router = express.Router();
const protectController = require('../controllers/protectController');

// POST /api/protect/step1 - 處理第一步文件上傳
router.post('/step1', protectController.handleStep1Upload);

module.exports = router;
