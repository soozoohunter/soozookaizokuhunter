/*************************************************************
 * express/routes/authRoutes.js
 * - 分層: 呼叫 controllers/authController 的 register & login
 *************************************************************/
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 使用者註冊
router.post('/register', authController.register);

// 使用者登入
router.post('/login', authController.login);

module.exports = router;
