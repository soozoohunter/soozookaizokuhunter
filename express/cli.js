require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { program } = require('commander');
const bcrypt = require('bcryptjs');
const { sequelize, User, SubscriptionPlan, UserSubscription } = require('./models');
const logger = require('./utils/logger');

process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的拒絕:', promise, '原因:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常:', error);
  process.exit(1);
});

console.log('===== 環境變量檢查 =====');
console.log('BCRYPT_SALT_ROUNDS:', process.env.BCRYPT_SALT_ROUNDS);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('========================');

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
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(adminDetails.password, saltRounds);
      logger.debug(`[CLI] 生成密碼哈希: ${hashedPassword.substring(0, 10)}...`);
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
        await user.update({
          password: hashedPassword,
          status: 'active',
          role: adminDetails.role
        });
        logger.warn(`[CLI] 管理員帳號 ${adminDetails.email} 已更新密碼和權限。`);
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
      await sequelize.authenticate();
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error(`找不到 Email 為 ${email} 的使用者。`);
      }
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      logger.debug(`[CLI] 新密碼哈希: ${hashedPassword.substring(0, 10)}...`);
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
    console.log('[CLI] 開始測試登入...');
    const { email, password } = options;

    if (!email || !password) {
      console.error('[CLI] 錯誤：需要 Email 和密碼');
      await sequelize.close();
      return;
    }

    try {
      console.log('[CLI] 嘗試驗證資料庫連線...');
      await sequelize.authenticate();
      console.log('[CLI] 資料庫連線成功');

      console.log(`[CLI] 搜尋使用者: ${email}`);
      const user = await User.findOne({
        where: { email },
        attributes: ['id', 'email', 'password']
      });

      if (!user) {
        console.error(`[CLI] 錯誤：找不到使用者 ${email}`);
        return;
      }

      console.log(`[CLI] 使用者找到: ${user.email}`);
      console.log(`[CLI] 資料庫密碼哈希: ${user.password.substring(0, 10)}... (長度: ${user.password.length})`);

      console.log('[CLI] 開始比對密碼...');
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        console.log('[CLI] 成功：密碼正確！');
      } else {
        console.error('[CLI] 錯誤：密碼比對失敗');

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        console.log(`[CLI] 使用鹽輪次: ${saltRounds} 生成新哈希`);
        const newHash = await bcrypt.hash(password, saltRounds);
        console.log(`[CLI] 新生成哈希: ${newHash.substring(0, 10)}... (長度: ${newHash.length})`);

        console.log(`[CLI] 哈希完全比對: ${user.password === newHash ? '相同' : '不同'}`);
      }
    } catch (error) {
      console.error('[CLI] 發生未捕獲的異常:');
      console.error('錯誤訊息:', error.message);
      console.error('堆棧追蹤:', error.stack);

      if (error.original) {
        console.error('原始資料庫錯誤:', error.original);
      }
    } finally {
      try {
        await sequelize.close();
        console.log('[CLI] 資料庫連線已關閉');
      } catch (closeError) {
        console.error('[CLI] 關閉連線失敗:', closeError);
      }
    }
  });

program.parse(process.argv);
