// express/routes/admin.js (最終版)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, SubscriptionPlan, UserSubscription } = require('../models');
const adminAuth = require('../middleware/adminAuth');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-strong-secret-key-for-dev';

// 管理員登入 API
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ message: '缺少帳號或密碼' });
    }

    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [{ email: identifier }, { phone: identifier }],
                role: 'admin'
            }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: '帳號或密碼錯誤，或非管理員帳號' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
            expiresIn: '8h'
        });
        return res.json({ message: 'Admin 登入成功', token });
    } catch (err) {
        logger.error('[AdminLogin Error]', err);
        return res.status(500).json({ error: '登入過程發生錯誤' });
    }
});

// === 以下所有 API 都需要先通過管理員驗證 ===
router.use(adminAuth);

// 獲取所有使用者列表及其當前的有效訂閱方案
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['createdAt', 'DESC']],
            include: {
                model: UserSubscription,
                as: 'subscriptions',
                where: { status: 'active' },
                required: false,
                include: {
                    model: SubscriptionPlan,
                    as: 'plan'
                }
            }
        });
        res.json(users);
    } catch (err) {
        logger.error('[Admin Users List Error]', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 為使用者指派/更新訂閱方案
router.put('/users/:userId/subscription', async (req, res) => {
    try {
        const { userId } = req.params;
        const { planCode, durationInMonths = 12 } = req.body;

        const plan = await SubscriptionPlan.findOne({ where: { plan_code: planCode } });
        if (!plan) return res.status(404).json({ error: 'Subscription plan not found' });
        
        await UserSubscription.update({ status: 'expired' }, { where: { user_id: userId, status: 'active' } });

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + parseInt(durationInMonths, 10));

        const newSubscription = await UserSubscription.create({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            started_at: new Date(),
            expires_at: expiresAt
        });

        const user = await User.findByPk(userId);
        if(user) {
            user.image_upload_limit = plan.image_limit;
            user.scan_limit_monthly = plan.scan_limit_monthly;
            user.dmca_takedown_limit_monthly = plan.dmca_takedown_limit_monthly;
            await user.save();
        }

        res.status(201).json({ message: 'Subscription updated successfully', subscription: newSubscription });
    } catch (err) {
        console.error('[Admin Update Subscription Error]', err);
        res.status(500).json({ error: 'Failed to update subscription' });
    }
});

module.exports = router;
