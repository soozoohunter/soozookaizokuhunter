/********************************************************************
 * createDefaultAdmin.js
 * 
 * 在伺服器啟動時，自動檢查是否有 jeffqqm@gmail.com 的帳號，
 * 若無，則建立一個預設 admin 帳戶，方便您在前端以此帳密登入。
 ********************************************************************/
const bcrypt = require('bcryptjs');
const { User } = require('./models'); // 注意：如果 models 資料夾位置不同，需調整路徑

// 預設管理員資訊
const DEFAULT_ADMIN_EMAIL = 'jeffqqm@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Zack967988'; // 依您的需求設定
const DEFAULT_ADMIN_USERNAME = 'Zackyao1005';  // 可自行命名
const DEFAULT_ADMIN_ROLE = 'admin';

async function createDefaultAdmin() {
  try {
    // 查詢是否已有此 email 的用戶
    const existing = await User.findOne({ where: { email: DEFAULT_ADMIN_EMAIL } });
    if (existing) {
      console.log(`[createDefaultAdmin] 已存在管理員帳號 ${DEFAULT_ADMIN_EMAIL}，不重複建立。`);
    } else {
      // 尚無此用戶 → 建立一個
      const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      const newAdmin = await User.create({
        email: DEFAULT_ADMIN_EMAIL,
        password: hashed,
        userName: DEFAULT_ADMIN_USERNAME,
        role: DEFAULT_ADMIN_ROLE,
        plan: 'BASIC'
      });
      console.log(`[createDefaultAdmin] 已建立管理員帳號: email=${DEFAULT_ADMIN_EMAIL}, 密碼=${DEFAULT_ADMIN_PASSWORD}, role=${DEFAULT_ADMIN_ROLE}`);
    }
  } catch (err) {
    console.error('[createDefaultAdmin] 建立預設管理員錯誤：', err);
  }
}

module.exports = { createDefaultAdmin };
