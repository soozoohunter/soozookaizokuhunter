// express/utils/mailer.js

require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * 範例：使用 Gmail 寄信
 * 若要使用 Gmail 寄信，請至 Google 帳戶開啟「應用程式密碼」或「降低安全性應用程式存取」(目前多為應用程式密碼)。
 * 在 .env 中設定：
 *   EMAIL_USER=你的Gmail帳號 (e.g. myaccount@gmail.com)
 *   EMAIL_PASS=你的Gmail應用程式密碼(16碼)
 */

const transporter = nodemailer.createTransport({
  service: 'gmail',  // 也可改為自訂的 SMTP，例如 host, port, secure, auth
  auth: {
    user: process.env.EMAIL_USER, // e.g. myaccount@gmail.com
    pass: process.env.EMAIL_PASS  // e.g. xxxxxxxxxxxxxxxx(16碼)
  }
});

/**
 * 發送電子郵件
 * @param {string} to      收件者 email
 * @param {string} subject 信件主旨
 * @param {string} html    郵件 HTML 內容 (可改成 text)
 */
async function sendMail(to, subject, html){
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // 顯示寄件者
      to,
      subject,
      html
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailer] 寄信成功:', info.messageId);
    return info;
  } catch (err) {
    console.error('[Mailer] 寄信失敗:', err);
    throw err;
  }
}

module.exports = { sendMail };
