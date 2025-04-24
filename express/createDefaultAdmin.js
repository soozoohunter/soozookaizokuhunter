/********************************************************************
 * express/createDefaultAdmin.js
 * 
 * 伺服器啟動時若無 admin，就建立預設 admin：
 *   - phone= 0900296168
 *   - email= jeffqqm@gmail.com
 *   - password= Zack967988
 ********************************************************************/
const bcrypt = require('bcryptjs');
const { User } = require('./models');

module.exports = async function createDefaultAdmin() {
  try {
    const defaultEmail = 'jeffqqm@gmail.com';
    const defaultPhone = '0900296168';
    const defaultPass = 'Zack967988';

    // 檢查有無此 email
    const oldAdmin = await User.findOne({ where: { email: defaultEmail } });
    if (oldAdmin) {
      console.log(`[InitAdmin] Admin already exists => ${defaultEmail}`);
      return;
    }

    const hashed = await bcrypt.hash(defaultPass, 10);
    const serialNumber = 'SNADMIN001';

    await User.create({
      serialNumber,
      email: defaultEmail,
      phone: defaultPhone,
      password: hashed,
      role: 'admin',
      realName: 'System Admin'
    });
    console.log(`[InitAdmin] Created admin => email=${defaultEmail}, phone=${defaultPhone}`);
  } catch (err) {
    console.error('[InitAdmin] error:', err);
  }
};
