// routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// GET /health - 系統健康檢查 (不需要JWT驗證)
router.get('/', healthController.check);

module.exports = router;
