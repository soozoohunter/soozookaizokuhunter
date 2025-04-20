/********************************************************************
 * express/createDefaultAdmin.js
 *
 * 在伺服器啟動後檢查是否已有 admin
 * 若無 => 建立預設 admin, 同時寫入區塊鏈 (Web3 版本)
 ********************************************************************/
const bcrypt = require('bcryptjs');
const { User } = require('./models');
const { registerUserOnBlockchain } = require('./services/blockchainService');

const DEFAULT_ADMIN_EMAIL = 'jeffqqm@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Zack967988';
const DEFAULT_ADMIN_USERNAME = 'zacyao1005';
const DEFAULT_ADMIN_ROLE = 'admin';

async function createDefaultAdmin() {
  try {
    const existing = await User.findOne({ where: { email: DEFAULT_ADMIN_EMAIL } });
    if (existing) {
      console.log(`[createDefaultAdmin] Admin ${DEFAULT_ADMIN_EMAIL} already exists.`);
      return;
    }

    const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    // 生成序號
    const dateStr = new Date().toISOString().replace(/[-:.T]/g, '').slice(0,8);
    const serialNumber = `${dateStr}-${Math.floor(Math.random()*100000)}`;

    // 先建 DB
    const newAdmin = await User.create({
      email: DEFAULT_ADMIN_EMAIL,
      userName: DEFAULT_ADMIN_USERNAME,
      password: hashed,
      role: DEFAULT_ADMIN_ROLE,
      plan: 'BASIC',
      serialNumber
    });

    // 呼叫區塊鏈
    try {
      const txHash = await registerUserOnBlockchain(
        DEFAULT_ADMIN_USERNAME,
        DEFAULT_ADMIN_ROLE,
        serialNumber,
        {}
      );
      console.log(`[createDefaultAdmin] Admin onChain => ${txHash}`);
    } catch (chainErr) {
      console.error('[createDefaultAdmin] Chain Error => rollback', chainErr);
      await newAdmin.destroy();
    }

    console.log(`[createDefaultAdmin] Created admin user => ${DEFAULT_ADMIN_EMAIL}`);
  } catch (err) {
    console.error('[createDefaultAdmin] error:', err);
  }
}

module.exports = { createDefaultAdmin };
