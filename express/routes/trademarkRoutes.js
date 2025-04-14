// routes/trademarkRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const planMiddleware = require('../middleware/planMiddleware');
const trademarkController = require('../controllers/trademarkController');

// GET /api/trademarks/search?q=xxx
router.get('/search', authMiddleware, planMiddleware('api'), trademarkController.search);

module.exports = router;
