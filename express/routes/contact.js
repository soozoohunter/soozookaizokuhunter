// express/routes/contact.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact'); // 若您有 contact model
const { GMAIL_USER, GMAIL_PASS } = process.env;

/**
 * POST /api/contact
 * 將前端的聯繫表單資料存入 DB，並用 nodemailer 寄給您。
 */
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      title,
      contactName,
      phone,
      email,
      message,
    } = req.body;

    // 基本檢查
    if (!contactName || !email || !message) {
      return res.status(400).json({
        error: 'Missing required fields: contactName, email, and message',
      });
    }

    // 1) (可選) 存入 DB
    // 如果您沒有這張 Contact table，可自行建立 models/Contact.js
    // 也可省略
    const newContact = await Contact.create({
      companyName,
      title,
      contactName,
      phone,
      email,
      message,
    });

    // 2) 寄信 (若沒設定 GMAIL_USER/PASS，就僅存 DB)
    if (GMAIL_USER && GMAIL_PASS) {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"ContactForm" <${GMAIL_USER}>`,
        to: GMAIL_USER, // 您的收件信箱
        subject: '[ContactUs] New Inquiry',
        html: `
          <h3>New Inquiry from ${contactName}</h3>
          <p><b>Company:</b> ${companyName || '(N/A)'}</p>
          <p><b>Title:</b> ${title || '(N/A)'}</p>
          <p><b>Phone:</b> ${phone || '(N/A)'}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Message:</b> ${message}</p>
          <p>(Record ID: ${newContact.id})</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return res.json({ message: 'OK' });
  } catch (err) {
    console.error('[Contact POST] error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
