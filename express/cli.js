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
        logger.info(`[CLI] Phone: ${adminDetails.phone}`);
        logger.info(`[CLI] 密碼: ${adminDetails.password}`);
        logger.info(`[CLI] =================================`);
      }
    } catch (error) {
      logger.error('[CLI] 建立管理員失敗:', error.message);
    }
    process.exit(0);
  });

// --- 手動開通/變更方案指令 ---
program
  .command('user:set-plan')
  .description('為指定使用者設定或變更訂閱方案')
  .option('-e, --email <string>', '使用者 Email')
  .option('-p, --plan-code <string>', '方案代碼 (例如: CREATOR, PROFESSIONAL)')
  .action(async (options) => {
    await sequelize.sync();
    const { email, planCode } = options;
    if (!email || !planCode) {
      logger.error('[CLI] 需要 Email (--email) 和方案代碼 (--plan-code)。');
      process.exit(1);
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
    }
    process.exit(0);
  });

program.parse(process.argv);
