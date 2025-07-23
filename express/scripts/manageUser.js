// express/scripts/manageUser.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { User, SubscriptionPlan, UserSubscription, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

const commands = {};

// --- 建立使用者 ---
commands.createUser = async (options) => {
    const { email, phone, password, name, role = 'member' } = options;
    if (!email || !phone || !password || !name) {
        throw new Error('Email, phone, password, and name are required.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user, created] = await User.findOrCreate({
        where: { email },
        defaults: {
            phone,
            password: hashedPassword,
            real_name: name,
            role,
            status: 'active'
        }
    });
    if (!created) {
        console.log(`User with email ${email} already exists.`);
        return user;
    }
    console.log(`Successfully created user: ${user.email} (Role: ${user.role})`);
    return user;
};

// --- 更改密碼 ---
commands.updatePassword = async (options) => {
    const { email, password } = options;
    if (!email || !password) throw new Error('Email and new password are required.');
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error(`User with email ${email} not found.`);
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    console.log(`Successfully updated password for ${email}.`);
};

// --- 開通/指派方案 ---
commands.grantPlan = async (options) => {
    const { email, planCode, months = 12 } = options;
    if (!email || !planCode) throw new Error('Email and planCode are required.');

    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error(`User with email ${email} not found.`);

    const plan = await SubscriptionPlan.findOne({ where: { plan_code: planCode } });
    if (!plan) throw new Error(`Plan with code '${planCode}' not found.`);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + parseInt(months, 10));

    await UserSubscription.create({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        started_at: new Date(),
        expires_at: expiresAt
    });

    console.log(`Successfully granted plan '${plan.name}' to ${email}, valid for ${months} months.`);
};

// --- 主執行函式 ---
const main = async () => {
    const args = require('minimist')(process.argv.slice(2));
    const command = args._[0];

    if (!commands[command]) {
        console.error('Invalid command. Available commands: createUser, updatePassword, grantPlan');
        process.exit(1);
    }
    
    try {
        await commands[command](args);
    } catch (error) {
        console.error('Operation failed:', error.message);
    } finally {
        await sequelize.close();
    }
};

main();
