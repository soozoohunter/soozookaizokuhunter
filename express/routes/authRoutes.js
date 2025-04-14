// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// POST /api/auth/register - 使用者註冊
router.post('/register', AuthController.register);

// POST /api/auth/login - 使用者登入
router.post('/login', AuthController.login);

module.exports = router;
