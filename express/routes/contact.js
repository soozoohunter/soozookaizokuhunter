// express/routes/contact.js
const express = require('express');
const router = express.Router();
// 若要寄信，可引入 nodemailer
// const nodemailer = require('nodemailer');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      title,
      contactName,
      phone,
      email,
      message
    } = req.body;

    // 簡單檢查必填
    if(!contactName || !email || !message){
      return res.status(400).json({ error:'缺少必要欄位 (姓名 / email / message)' });
    }

    // 這裡可以改成存入 DB，或用 nodemailer 寄信給你
    console.log('[Contact Form]', {
      companyName, 
      title,
      contactName,
      phone,
      email,
      message
    });

    // 範例: 如果要寄信，可於此處使用 nodemailer:
    /*
    let transporter = nodemailer.createTransport({
      service: 'gmail', // 或自訂 smtp
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
    let info = await transporter.sendMail({
      from: `"系統通知" <${process.env.GMAIL_USER}>`,
      to: "yourEmail@domain.com", // 收件人
      subject: `聯絡表單 - 來自: ${contactName}`,
      text: `公司:${companyName}\n職稱:${title}\n聯絡人:${contactName}\n電話:${phone}\nEmail:${email}\n需求:${message}`,
    });
    console.log('Contact mail sent:', info.messageId);
    */

    // 回傳成功
    return res.json({ message:'已收到您的聯絡資訊' });
  } catch(err){
    console.error('[POST /api/contact] Error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
