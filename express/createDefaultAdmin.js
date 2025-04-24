/********************************************************************
 * express/createDefaultAdmin.js
 *
 * 在伺服器啟動後檢查是否已有 admin
 * 若無 => 建立預設 admin, 同時可視需要寫入區塊鏈
 ********************************************************************/
const bcrypt = require('bcryptjs');
const { User } = require('./models');
// const { registerUserOnBlockchain } = require('./services/blockchainService'); // 如需可再引入

async function createDefaultAdmin() {
  try {
    const email = 'zacyao1005@example.com';
    const plainPwd = 'Zack967988';
    const userName = 'zacyao1005';  
    const role = 'admin';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`[createDefaultAdmin] Admin ${email} already exists.`);
      return;
    }

    const hashed = await bcrypt.hash(plainPwd, 10);

    // 產生隨機序號 or 自訂
    const dateStr = new Date().toISOString().replace(/[-:.T]/g, '').slice(0,8);
    const serialNumber = `${dateStr}-ADMIN`;

    // 建立 user
    const newAdmin = await User.create({
      email,
      userName,
      password: hashed,
      role,
      serialNumber
    });

    // 如果需要上鏈
    /*
    try {
      const txHash = await registerUserOnBlockchain(userName, role, serialNumber, {});
      console.log(`[createDefaultAdmin] Admin onChain => ${txHash}`);
    } catch (chainErr) {
      console.error('[createDefaultAdmin] Chain Error => rollback', chainErr);
      await newAdmin.destroy();
    }
    */

    console.log(`[createDefaultAdmin] Created admin => ${email}`);
  } catch (err) {
    console.error('[createDefaultAdmin] error:', err);
  }
}

module.exports = createDefaultAdmin;
