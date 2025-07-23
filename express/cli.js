require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { program } = require('commander');
const bcrypt = require('bcryptjs');
const { sequelize, User, SubscriptionPlan, UserSubscription } = require('./models');
const logger = require('./utils/logger');

// ★ 您的專屬管理員建立指令 ★
program
  .command('user:create-admin')
  .description('建立您指定的超級管理員帳號')
  .action(async () => {
    try {
      // 先驗證資料庫連線再同步模型，避免隱藏的連線問題
      await sequelize.authenticate();
      await sequelize.sync();
      const adminDetails = {
        email: 'jeffqqm@gmail.com',
        phone: '0900296168',
        password: 'Zack967988',
        name: 'SUZOO Admin',
        role: 'admin',
      };
      const hashedPassword = await bcrypt.hash(adminDetails.password, 10);
      const [user, created] = await User.findOrCreate({
        where: { email: adminDetails.email },
        defaults: {
          phone: adminDetails.phone,
          password: hashedPassword,
          real_name: adminDetails.name,
          role: adminDetails.role,
          status: 'active',
        }
      });
      if (!created) {
        logger.warn(`[CLI] 管理員帳號 ${adminDetails.email} 已經存在。`);
      } else {
        logger.info(`[CLI] === 超級管理員帳號已成功建立！ ===`);
        logger.info(`[CLI] Email: ${adminDetails.email}`);
        logger.info(`[CLI] 請使用您指定的密碼登入。`);
        logger.info(`[CLI] =================================`);
      }
    } catch (error) {
      logger.error('[CLI] 建立管理員失敗:', error.message);
    } finally {
      // 確保資料庫連線在使用後關閉
      await sequelize.close();
    }
  });

// ★ 強制重設密碼指令 ★
program
  .command('user:reset-password')
  .description('強制重設指定使用者的密碼')
  .option('-e, --email <string>', '要重設密碼的使用者 Email')
  .option('-pw, --password <string>', '要設定的新密碼')
  .action(async (options) => {
    const { email, password } = options;
    if (!email || !password) {
      logger.error('[CLI] 需要 Email (--email) 和新密碼 (--password)。');
      // 確保在錯誤情況下也關閉連線
      await sequelize.close();
      return;
    }
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error(`找不到 Email 為 ${email} 的使用者。`);
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
      logger.info(`[CLI] 已成功為 ${email} 重設密碼。`);
    } catch (error) {
      logger.error('[CLI] 重設密碼失敗:', error.message);
    } finally {
      // 確保資料庫連線在使用後關閉
      await sequelize.close();
    }
  });

// ★ 測試登入指令 ★
program
  .command('user:test-login')
  .description('測試指定使用者的登入')
  .option('-e, --email <string>', '使用者 Email')
  .option('-pw, --password <string>', '密碼')
  .action(async (options) => {
    const { email, password } = options;
    if (!email || !password) {
      logger.error('[CLI] 需要 Email (--email) 和密碼 (--password)。');
      await sequelize.close();
      return;
    }
    try {
      await sequelize.authenticate();
      const user = await User.findOne({ where: { email } });
      if (!user) {
        logger.warn(`[CLI] 找不到 Email 為 ${email} 的使用者。`);
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        logger.info(`[CLI] 密碼正確！使用者 ${email} 可以登入。`);
      } else {
        logger.warn(`[CLI] 密碼錯誤！使用者 ${email} 無法登入。`);
      }
    } catch (error) {
      logger.error('[CLI] 測試登入失敗:', error.message);
    } finally {
      await sequelize.close();
    }
  });

program.parse(process.argv);
