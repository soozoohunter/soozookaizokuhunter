// express/routes/admin.js (最終統一架構版)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, SubscriptionPlan, UserSubscription, File, Scan } = require('../models');
const adminAuth = require('../middleware/adminAuth'); // 確保您已建立此管理員專用中介層

const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

// 管理員登入 API
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: '缺少帳號或密碼' });
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [{ email: username }, { phone: username }],
                role: 'admin' // 直接在查詢時就限定必須是 admin
            }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '帳號或密碼錯誤，或非管理員帳號' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
            expiresIn: '8h' // 管理員 token 效期 8 小時
        });
        return res.json({ message: 'Admin 登入成功', token });
    } catch (err) {
        console.error('[AdminLogin Error]', err);
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
                as: 'subscriptions', // 確保 User 模型關聯中設定了 as: 'subscriptions'
                where: { status: 'active' },
                required: false, // 使用 LEFT JOIN，即使沒有訂閱方案的使用者也會被列出
                include: {
                    model: SubscriptionPlan,
                    as: 'plan' // 確保 UserSubscription 模型關聯中設定了 as: 'plan'
                }
            }
        });
        res.json(users);
    } catch (err) {
        console.error('[Admin Users List Error]', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 為使用者指派/更新訂閱方案
router.put('/users/:userId/subscription', async (req, res) => {
    try {
        const { userId } = req.params;
        const { planCode, durationInMonths = 12 } = req.body; // 預設給予 12 個月

        const plan = await SubscriptionPlan.findOne({ where: { plan_code: planCode } });
        if (!plan) return res.status(404).json({ error: 'Subscription plan not found' });
        
        // 尋找該使用者現有的 active 訂閱，若有則先將其設為 expired
        await UserSubscription.update(
            { status: 'expired' },
            { where: { user_id: userId, status: 'active' } }
        );

        // 建立新的訂閱紀錄
        const startedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + parseInt(durationInMonths, 10));

        const newSubscription = await UserSubscription.create({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            started_at: startedAt,
            expires_at: expiresAt
        });

        // 當指派新方案時，同時更新 User 表上的額度欄位
        const user = await User.findByPk(userId);
        if (user) {
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

// [新功能] 手動修改使用者的額度與狀態
router.put('/users/:userId/overrides', async (req, res) => {
    try {
        const { userId } = req.params;
        const { image_upload_limit, scan_limit_monthly, status } = req.body;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (image_upload_limit !== undefined) user.image_upload_limit = image_upload_limit;
        if (scan_limit_monthly !== undefined) user.scan_limit_monthly = scan_limit_monthly;
        if (status) user.status = status;

        await user.save();
        res.json({ message: 'User overrides applied successfully.', user });

    } catch (err) {
        console.error('[Admin Overrides Error]', err);
        res.status(500).json({ error: 'Failed to apply overrides.' });
    }
});

module.exports = router;
