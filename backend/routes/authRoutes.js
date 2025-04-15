const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 使用者註冊 API
router.post('/register', authController.register);

// 使用者登入 API
router.post('/login', authController.login);

module.exports = router;
