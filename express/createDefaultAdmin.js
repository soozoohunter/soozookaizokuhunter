/********************************************************************
 * express/createDefaultAdmin.js
 * 
 * 在伺服器啟動時，若尚無 admin，建立
 *  - Email: jeffqqm@gmail.com
 *  - phone: 0900296168
 *  - password: Zack967988
 ********************************************************************/
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createDefaultAdmin() {
  try {
    // ★ 此處硬碼
    const email = 'jeffqqm@gmail.com';
    const phone = '0900296168';
    const plainPwd = 'Zack967988';

    // 檢查 DB 是否已有此 email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`[createDefaultAdmin] Admin ${email} already exists.`);
      return;
    }

    const hashed = await bcrypt.hash(plainPwd, 10);

    // 寫死 serialNumber
    const serialNumber = 'SNADMIN001';

    await User.create({
      serialNumber,
      email,
      phone,
      password: hashed,
      role: 'admin',
      realName: 'System Admin'
    });

    console.log(`[createDefaultAdmin] Created admin => ${email}, phone=${phone}`);
  } catch (err) {
    console.error('[createDefaultAdmin] error:', err);
  }
}

module.exports = createDefaultAdmin;
