// testMail.js
const nodemailer = require('nodemailer');

async function sendTestMail(){
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jeffqqm@gmail.com',
        pass: 'ydam ngzh kcil ljha
      }
    });

    let info = await transporter.sendMail({
      from: '"系統名稱" <jeffqqm@gmail.com>',
      to: '收件者@example.com',
      subject: '測試寄信',
      text: '這是一封測試郵件',
      html: '<p>這是一封測試郵件</p>'
    });

    console.log('已寄出，訊息ID:', info.messageId);
  } catch (err) {
    console.error('寄信失敗:', err);
  }
}

sendTestMail();
