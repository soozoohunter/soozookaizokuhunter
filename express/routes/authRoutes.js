const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 註冊新帳號
router.post('/register', authController.register);

// 使用者登入
router.post('/login', authController.login);

module.exports = router;
