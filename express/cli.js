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
    await sequelize.sync();
    const adminDetails = {
      email: 'jeffqqm@gmail.com',
      phone: '0900296168',
      password: 'Zack967988',
      name: 'SUZOO Admin',
      role: 'admin',
    };
    try {
      const hashedPassword = await bcrypt.hash(adminDetails.password, 10);
      const [user, created] = await User.findOrCreate({
        where: { email: adminDetails.email },
        defaults: {
          email: adminDetails.email,
          phone: adminDetails.phone,
          password: hashedPassword,
          real_name: adminDetails.name,
          role: adminDetails.role,
          status: 'active',
        }
      });
      if (!created) {
        logger.warn(`[CLI] Admin user ${adminDetails.email} already exists.`);
      } else {
        logger.info(`[CLI] === 超級管理員帳號已成功建立！ ===`);
        logger.info(`[CLI] Email: ${adminDetails.email}`);
        logger.info(`[CLI] Phone: ${adminDetails.phone}`);
        logger.info(`[CLI] Password: ${adminDetails.password} (這是您的明文密碼，請妥善保管)`);
        logger.info(`[CLI] =================================`);
      }
    } catch (error) {
      logger.error('[CLI] Failed to create admin user:', error.message);
    }
    process.exit(0);
  });

// --- 通用使用者管理指令 ---
program
  .command('user:create')
  .description('建立一個新的使用者帳號')
  .option('-e, --email <string>', '使用者 Email')
  .option('-p, --phone <string>', '使用者手機號碼')
  .option('-pw, --password <string>', '使用者密碼')
  .option('-n, --name <string>', '使用者暱稱')
  .option('--role <string>', '使用者角色 (user, admin, trial)', 'user')
  .action(async (options) => {
    await sequelize.sync();
    const { email, phone, password, name, role } = options;
    if (!email || !phone || !password || !name) {
      logger.error('[CLI] Email, phone, password, and name are required.');
      process.exit(1);
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [user, created] = await User.findOrCreate({
        where: { email },
        defaults: { email, phone, password: hashedPassword, real_name: name, role, status: 'active' }
      });
      if (!created) {
        logger.warn(`[CLI] User with email ${email} already exists.`);
      } else {
        logger.info(`[CLI] User ${email} created successfully with role ${role}.`);
      }
    } catch (error) {
      logger.error('[CLI] Failed to create user:', error.message);
    }
    process.exit(0);
  });

// --- 手動開通/變更方案指令 ---
program
  .command('user:set-plan')
  .description('為指定使用者設定或變更訂閱方案')
  .option('-e, --email <string>', '使用者 Email')
  .option('-p, --plan-code <string>', '方案代碼 (e.g., CREATOR, PROFESSIONAL)')
  .action(async (options) => {
    await sequelize.sync();
    const { email, planCode } = options;
    if (!email || !planCode) {
      logger.error('[CLI] Email and plan-code are required.');
      process.exit(1);
    }
    const transaction = await sequelize.transaction();
    try {
      const user = await User.findOne({ where: { email }, transaction });
      const plan = await SubscriptionPlan.findOne({ where: { plan_code: planCode }, transaction });

      if (!user) throw new Error(`User with email ${email} not found.`);
      if (!plan) throw new Error(`Subscription plan with code ${planCode} not found.`);

      await UserSubscription.update(
        { status: 'expired' },
        { where: { user_id: user.id, status: 'active' }, transaction }
      );

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await UserSubscription.create({
        user_id: user.id, plan_id: plan.id, status: 'active',
        started_at: new Date(), expires_at: expiresAt,
      }, { transaction });

      await user.update({
        role: 'member',
        quota: (user.quota || 0) + (plan.works_quota || 0),
      }, { transaction });

      await transaction.commit();
      logger.info(`[CLI] Successfully activated plan '${plan.name}' for user ${email}.`);
    } catch (error) {
      await transaction.rollback();
      logger.error('[CLI] Failed to set user plan:', error.message);
    }
    process.exit(0);
  });

program.parse(process.argv);
