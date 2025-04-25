/********************************************************************
 * express/createDefaultAdmin.js
 * 
 * 伺服器啟動時，若無符合 phone/email 的 admin，就建立 or 更新為 admin：
 *   - phone= 0900296168
 *   - email= jeffqqm@gmail.com
 *   - password= Zack967988
 ********************************************************************/
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('./models');

module.exports = async function createDefaultAdmin() {
  try {
    const defaultEmail = 'jeffqqm@gmail.com';
    const defaultPhone = '0900296168';
    const defaultPass = 'Zack967988';

    // 1) 檢查有無相同 email 或 phone 的使用者
    const oldAdmin = await User.findOne({
      where: {
        [Op.or]: [
          { email: defaultEmail },
          { phone: defaultPhone }
        ]
      }
    });

    // 2) 若已存在 => 強制更新為 admin + 預設密碼
    if (oldAdmin) {
      console.log(`[InitAdmin] Found user => email=${oldAdmin.email}, phone=${oldAdmin.phone}`);

      // 檢查 role
      if (oldAdmin.role !== 'admin') {
        console.log('[InitAdmin] This user is not admin. Updating role & password...');
        oldAdmin.role = 'admin';
      }

      // 更新密碼成預設 (確保能登入)
      const hashed = await bcrypt.hash(defaultPass, 10);
      oldAdmin.password = hashed;

      // 若沒有序號，設為 'SNADMIN001'
      if (!oldAdmin.serialNumber) {
        oldAdmin.serialNumber = 'SNADMIN001';
      }

      await oldAdmin.save();
      console.log(`[InitAdmin] Updated to admin => ${oldAdmin.email}, pass=${defaultPass}`);
      return;
    }

    // 3) 若尚無 -> 新建 admin
    const hashed = await bcrypt.hash(defaultPass, 10);
    await User.create({
      serialNumber: 'SNADMIN001',
      email: defaultEmail,
      phone: defaultPhone,
      password: hashed,
      role: 'admin',
      realName: 'System Admin'
    });
    console.log(`[InitAdmin] Created admin => email=${defaultEmail}, phone=${defaultPhone}, pass=${defaultPass}`);

  } catch (err) {
    console.error('[InitAdmin] error:', err);
  }
};
