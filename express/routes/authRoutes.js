/*************************************************************
 * express/routes/authRoutes.js
 * * - /auth/login
 * - /auth/register
 *************************************************************/
const express = require('express');
const router = express.Router();

// 使用整合式 Auth Controller，支援 username 登錄與註冊
const { register, login } = require('../controllers/authController');

/**
 * POST /auth/login
 * - 支援 email 或 username 登入
 */
router.post('/login', login);

/**
 * POST /auth/register
 * - 以 username + email 建立帳號
*/
router.post('/register', register);

module.exports = router;
