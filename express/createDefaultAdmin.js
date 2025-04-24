/********************************************************************
 * express/createDefaultAdmin.js
 *
 * 在伺服器啟動後檢查是否已有 admin
 * 若無 => 建立預設 admin, 同時可視需要寫入區塊鏈 (可在下方註解部分加上鏈邏輯)
 ********************************************************************/
const bcrypt = require('bcryptjs');
const { User } = require('./models');
// const { registerUserOnBlockchain } = require('./services/blockchainService'); // 如需可再引入

async function createDefaultAdmin() {
  try {
    // 如果 .env 中有指定 ADMIN_EMAIL / ADMIN_PASS / ADMIN_USERNAME
    // 就優先使用，否則 fallback 到您原本的硬碼
    const email = process.env.ADMIN_EMAIL || 'zacyao1005@example.com';
    const plainPwd = process.env.ADMIN_PASS || 'Zack967988';
    const userName = process.env.ADMIN_USERNAME || 'zacyao1005';
    const role = 'admin';  // 預設為 admin

    // 檢查 DB 是否已有此 email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`[createDefaultAdmin] Admin ${email} already exists.`);
      return;
    }

    // 雜湊密碼
    const hashed = await bcrypt.hash(plainPwd, 10);

    // 產生 dateStr 序號 (或保留既定做法)
    const dateStr = new Date().toISOString().replace(/[-:.T]/g, '').slice(0,8);
    const serialNumber = `${dateStr}-ADMIN`;

    // 建立 admin
    const newAdmin = await User.create({
      email,
      username: userName,   // DB 欄位名是 username
      password: hashed,
      role,
      serialNumber
    });

    // 如需上鏈，可在此呼叫您的 blockchainService
    /*
    try {
      const txHash = await registerUserOnBlockchain(userName, role, serialNumber, {});
      console.log(`[createDefaultAdmin] Admin onChain => ${txHash}`);
    } catch (chainErr) {
      console.error('[createDefaultAdmin] Chain Error => rollback', chainErr);
      await newAdmin.destroy(); // 若上鏈失敗，可視需求 rollback
    }
    */

    console.log(`[createDefaultAdmin] Created admin => ${email}`);
  } catch (err) {
    console.error('[createDefaultAdmin] error:', err);
  }
}

module.exports = createDefaultAdmin;
