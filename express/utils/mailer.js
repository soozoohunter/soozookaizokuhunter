const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',  // 可自行改為其他 SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendMail(to, subject, html){
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  };
  let info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = { sendMail };
