const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, SubscriptionPlan, UserSubscription } = require('../models');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-strong-secret-key-for-dev';

// POST /api/auth/register (註冊邏輯)
router.post('/register', async (req, res) => {
    const email = req.body.email ? req.body.email.trim() : '';
    const phone = req.body.phone ? req.body.phone.trim() : '';
    const password = req.body.password;
    const realName = req.body.realName ? req.body.realName.trim() : '';

    if (!email || !password || !phone || !realName) {
        return res.status(400).json({ message: '暱稱、Email、密碼和手機號碼為必填項。' });
    }
    try {
        const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
        if (existingUser) {
            return res.status(409).json({ message: '此 Email 或手機號碼已被註冊。' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const freePlan = await SubscriptionPlan.findOne({ where: { plan_code: 'FREE' } }); // 確保您的 seeder 有 'FREE' 方案
        const newUser = await User.create({
            real_name: realName,
            email: email,
            phone: phone,
            password: hashedPassword,
            role: 'member', // 註冊用戶預設為 member
            status: 'active',
            quota: freePlan ? freePlan.works_quota : 5,
        });
        if (freePlan) {
            await UserSubscription.create({
                user_id: newUser.id,
                plan_id: freePlan.id,
                status: 'active',
                started_at: new Date(),
                expires_at: null, // 免費版永不過期
            });
        }
        logger.info(`[Register] New user registered successfully: ${newUser.email}`);
        res.status(201).json({ message: '註冊成功！請前往登入。' });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message });
        }
        logger.error('[Register] Error:', error);
        res.status(500).json({ message: '伺服器註冊時發生錯誤。' });
    }
});

// POST /api/auth/login (登入邏輯)
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ message: '請提供帳號和密碼。' });
    }
    try {
        const user = await User.findOne({
             where: { [Op.or]: [{ email: identifier.trim() }, { phone: identifier.trim() }] }
        });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: '帳號或密碼錯誤' });
        }
        user.last_login = new Date();
        await user.save();
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        res.json({
            message: '登入成功',
            token,
            user: { id: user.id, email: user.email, role: user.role, realName: user.real_name }
        });
    } catch (error) {
        logger.error('[Login] Error:', error);
        res.status(500).json({ message: '伺服器登入時發生錯誤。'});
    }
});

module.exports = router;
