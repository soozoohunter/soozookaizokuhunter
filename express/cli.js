require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { program } = require('commander');
const bcrypt = require('bcryptjs');
const { sequelize, User, SubscriptionPlan, UserSubscription } = require('./models');
const logger = require('../utils/logger');

// ★★★ 新增：建立擁有頂級方案的超級會員帳號 ★★★
program
  .command('user:create-superuser')
  .description('建立一個擁有頂級 PROFESSIONAL 方案的超級會員帳號')
  .action(async () => {
    const superUserDetails = {
      email: 'zacyao88@icloud.com',
      phone: '0911690757',
      password: 'Zack967988',
      name: 'Zac Yao (Superuser)',
      role: 'member', // 超級會員的角色依然是 'member'，權限來自於訂閱方案
    };
    const planCode = 'PROFESSIONAL';
    const transaction = await sequelize.transaction();
    
    try {
      await sequelize.sync();
      
      // 步驟一：建立或找到使用者
      const hashedPassword = await bcrypt.hash(superUserDetails.password, 10);
      const [user, created] = await User.findOrCreate({
        where: { email: superUserDetails.email },
        defaults: {
          phone: superUserDetails.phone,
          password: hashedPassword,
          real_name: superUserDetails.name,
          role: superUserDetails.role,
          status: 'active',
        },
        transaction
      });
      
      if (created) {
        logger.info(`[CLI] Superuser ${user.email} created.`);
      } else {
        logger.warn(`[CLI] Superuser ${user.email} already exists. Proceeding to grant plan.`);
      }
      
      // 步驟二：找到 PROFESSIONAL 方案
      const plan = await SubscriptionPlan.findOne({ where: { plan_code: planCode }, transaction });
      if (!plan) {
        throw new Error(`找不到方案代碼為 '${planCode}' 的方案。請先執行 seeder 填充資料庫。`);
      }

      // 步驟三：開通訂閱方案 (先將舊的設為過期，再建立新的)
      await UserSubscription.update(
        { status: 'expired' },
        { where: { user_id: user.id, status: 'active' }, transaction }
      );
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 10); // 給予十年效期

      await UserSubscription.create({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        started_at: new Date(),
        expires_at: expiresAt,
      }, { transaction });
      
      // 步驟四：更新使用者的額度
      await user.update({
        quota: plan.works_quota
      }, { transaction });

      await transaction.commit();
      logger.info(`[CLI] === 超級會員帳號已成功設定！ ===`);
      logger.info(`[CLI] Email: ${user.email}`);
      logger.info(`[CLI] 已成功為其開通 '${plan.name}' 方案。`);
      logger.info(`[CLI] =================================`);

    } catch (error) {
      await transaction.rollback();
      logger.error('[CLI] 建立超級會員失敗:', error.message);
    } finally {
      await sequelize.close();
    }
  });


// --- 原有的管理員建立指令 ---
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
          phone: adminDetails.phone, password: hashedPassword,
          real_name: adminDetails.name, role: adminDetails.role, status: 'active',
        }
      });
      if (!created) {
        logger.warn(`[CLI] 管理員帳號 ${adminDetails.email} 已經存在。`);
      } else {
        logger.info(`[CLI] === 超級管理員帳號已成功建立！ ===`);
      }
    } catch (error) {
      logger.error('[CLI] 建立管理員失敗:', error.message);
    } finally {
      await sequelize.close();
    }
  });

// --- 原有的強制重設密碼指令 ---
program
  .command('user:reset-password')
  .description('強制重設指定使用者的密碼')
  .option('-e, --email <string>', '使用者 Email')
  .option('-p, --password <string>', '新密碼')
  .action(async (options) => {
    // ... (此指令邏輯保持不變)
    const { email, password } = options;
    if (!email || !password) {
      logger.error('[CLI] 需要 Email 和新密碼。');
      return sequelize.close();
    }
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error(`找不到 Email 為 ${email} 的使用者。`);
      user.password = await bcrypt.hash(password, 10);
      await user.save();
      logger.info(`[CLI] 已成功為 ${email} 重設密碼。`);
    } catch (error) {
      logger.error('[CLI] 重設密碼失敗:', error.message);
    } finally {
      await sequelize.close();
    }
  });

program.parse(process.argv);
