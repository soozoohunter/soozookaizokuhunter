/********************************************************************
 * express/createDefaultAdmin.js
 * * 伺服器啟動時，若無符合 phone/email 的使用者，則新建 admin。
 * 若找到了但不是 admin，則強制更新為 admin + 重設預設密碼。
 * (已整合 Winston Logger)
 ********************************************************************/
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('./models');
const logger = require('./utils/logger'); // 使用新的 Winston logger

module.exports = async function createDefaultAdmin() {
  try {
    const defaultEmail = process.env.ADMIN_EMAIL;
    const defaultPhone = process.env.ADMIN_PHONE;
    const defaultPass = process.env.ADMIN_PASS;

    if (!defaultEmail || !defaultPhone || !defaultPass) {
      logger.warn('[AdminSetup] ADMIN_EMAIL, ADMIN_PHONE, or ADMIN_PASS environment variables are required. Skipping setup.');
      return;
    }

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
      logger.info(`[AdminSetup] Found an existing user with email: ${existing.email} / phone: ${existing.phone}`);

      let needsSave = false;
      // 不是 admin 就升級為 admin
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        needsSave = true;
        logger.info(`[AdminSetup] Updating user role to 'admin'.`);
      }
      
      // 重置密碼
      const hashed = await bcrypt.hash(defaultPass, 10);
      existing.password = hashed;
      needsSave = true;
      logger.info(`[AdminSetup] Resetting password for admin user.`);

      // 若沒有 serialNumber，就補一下
      if (!existing.serialNumber) {
        existing.serialNumber = 'SNADMIN001';
        needsSave = true;
        logger.info(`[AdminSetup] Adding default serial number 'SNADMIN001'.`);
      }

      if (needsSave) {
        await existing.save();
        logger.info(`[AdminSetup] Admin user ${existing.email} has been updated successfully.`);
      } else {
        logger.info(`[AdminSetup] Admin user ${existing.email} is already up to date.`);
      }
      return;
    }

    // 若不存在 => 新建 admin
    logger.info(`[AdminSetup] No existing admin found. Creating a new admin user with email: ${defaultEmail}`);
    const hashed = await bcrypt.hash(defaultPass, 10);
      await User.create({
        serialNumber: 'SNADMIN001',
        email: defaultEmail,
        phone: defaultPhone,
        password: hashed,
        role: 'admin',
        realName: 'System Admin',
        username: 'admin_user'
      });
    logger.info(`[AdminSetup] New admin user created successfully with email: ${defaultEmail}`);

  } catch (error) {
    logger.error('[AdminSetup] Failed to setup default admin user.', {
      message: error.message,
      originalError: error.original?.message,
    });
  }
};
