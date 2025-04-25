/********************************************************************
 * express/createDefaultAdmin.js
 * 
 * 伺服器啟動時，若無符合 phone/email 的使用者，則新建 admin。
 * 若找到了但不是 admin，則強制更新為 admin + 重設預設密碼。
 ********************************************************************/
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('./models');

module.exports = async function createDefaultAdmin() {
  try {
    const defaultEmail = 'jeffqqm@gmail.com';
    const defaultPhone = '0900296168';
    const defaultPass = 'Zack967988';

    // 查找相同 email or phone 的使用者
    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { email: defaultEmail },
          { phone: defaultPhone }
        ]
      }
    });

    if (existing) {
      console.log('[InitAdmin] Found user =>', existing.email, existing.phone);

      // 不是 admin 就升級為 admin，並重置密碼
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        console.log('[InitAdmin] Updating role => admin');
      }
      // 重置密碼
      const hashed = await bcrypt.hash(defaultPass, 10);
      existing.password = hashed;

      // 若沒有 serialNumber，就補一下
      if (!existing.serialNumber) {
        existing.serialNumber = 'SNADMIN001';
      }
      await existing.save();

      console.log(`[InitAdmin] Updated admin => email=${existing.email}, pass=${defaultPass}`);
      return;
    }

    // 若不存在 => 新建 admin
    const hashed = await bcrypt.hash(defaultPass, 10);
    await User.create({
      serialNumber: 'SNADMIN001',
      email: defaultEmail,
      phone: defaultPhone,
      password: hashed,
      role: 'admin',
      realName: 'System Admin',
      username: 'zacyao1005' // 看您需求，也可用預設 username
    });
    console.log(`[InitAdmin] Created admin => email=${defaultEmail}, pass=${defaultPass}`);
  } catch (err) {
    console.error('[InitAdmin] error:', err);
  }
};
