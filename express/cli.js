// express/cli.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { program } = require('commander');
const bcrypt = require('bcryptjs');
const { sequelize, User, SubscriptionPlan, UserSubscription } = require('./models');
const logger = require('./utils/logger');

// --- ★ 您的專屬管理員建立指令 ★ ---
program
  .command('user:create-admin')
  .description('建立您指定的超級管理員帳號')
  .action(async () => {
    try {
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
      await sequelize.close();
    }
  });

// --- 強制重設密碼指令 ---
program
  .command('user:reset-password')
  .description('強制重設指定使用者的密碼')
  .option('-e, --email <string>', '要重設密碼的使用者 Email')
  .option('-pw, --password <string>', '要設定的新密碼')
  .action(async (options) => {
    const { email, password } = options;
    if (!email || !password) {
      logger.error('[CLI] 需要 Email (--email) 和新密碼 (--password)。');
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
      await sequelize.close();
    }
  });

// --- 手動開通/變更方案指令 ---
program
  .command('user:set-plan')
  .description('為指定使用者設定或變更訂閱方案')
  .option('-e, --email <string>', '使用者 Email')
  .option('-p, --plan-code <string>', '方案代碼 (例如: CREATOR, PROFESSIONAL)')
  .action(async (options) => {
    const { email, planCode } = options;
    if (!email || !planCode) {
      logger.error('[CLI] 需要 Email (--email) 和方案代碼 (--plan-code)。');
      return;
    }
    const transaction = await sequelize.transaction();
    try {
      const user = await User.findOne({ where: { email }, transaction });
      const plan = await SubscriptionPlan.findOne({ where: { plan_code: planCode }, transaction });
      if (!user) throw new Error(`找不到 Email 為 ${email} 的使用者。`);
      if (!plan) throw new Error(`找不到代碼為 ${planCode} 的方案。`);
      
      await UserSubscription.update(
        { status: 'expired' },
        { where: { user_id: user.id, status: 'active' }, transaction }
      );
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await UserSubscription.create({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        started_at: new Date(),
        expires_at: expiresAt,
      }, { transaction });
      await user.update({
        role: 'member',
        quota: (user.quota || 0) + (plan.works_quota || 0),
      }, { transaction });
      await transaction.commit();
      logger.info(`[CLI] 已成功為 ${email} 開通 '${plan.name}' 方案，效期一年。`);
    } catch (error) {
      await transaction.rollback();
      logger.error('[CLI] 設定方案失敗:', error.message);
    } finally {
      await sequelize.close();
    }
  });

program.parse(process.argv);
