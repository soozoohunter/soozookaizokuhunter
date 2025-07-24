// express/routes/contact.js
const express = require('express');
const router = express.Router();
// 若要寄信，可引入 nodemailer
// const nodemailer = require('nodemailer');

const { ContactSubmission } = require('../models');
const logger = require('../utils/logger');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: '姓名、Email 和訊息為必填項。' });
    }

    await ContactSubmission.create({
      name,
      email,
      message,
      // 若有登入用戶，可在此記錄 ID
      // user_id: req.user ? req.user.id : null
    });

    logger.info(`[Contact Form] Received new submission from ${email}`);

    return res.json({ message: '感謝您的聯絡，我們已收到您的訊息！' });
  } catch (err) {
    logger.error('[Contact API] Error saving submission:', err);
    res.status(500).json({ message: '提交時發生錯誤，請稍後再試。' });
  }
});

module.exports = router;
