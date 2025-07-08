// express/routes/authRoutes.js (最終版)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, SubscriptionPlan, UserSubscription } = require('../models');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-strong-secret-key-for-dev';

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password, phone } = req.body;

    if (!email || !password || !phone) {
        return res.status(400).json({ message: 'Email、密碼和手機號碼為必填項。' });
    }

    try {
        const existingUser = await User.findOne({
            where: { [Op.or]: [{ email }, { phone }] }
        });

        if (existingUser) {
            return res.status(409).json({ message: '此 Email 或手機號碼已被註冊。' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const freePlan = await SubscriptionPlan.findOne({ where: { plan_code: 'free_trial' } });

        if (!freePlan) {
            logger.error('[Register] CRITICAL: free_trial plan not found in database.');
            return res.status(500).json({ message: '伺服器設定錯誤：找不到預設方案。' });
        }

        const newUser = await User.create({
            ...req.body,
            username: phone, // 使用手機作為預設 username
            password: hashedPassword,
            role: 'user',
            status: 'active',
            image_upload_limit: freePlan.image_limit,
            scan_limit_monthly: freePlan.scan_limit_monthly,
            dmca_takedown_limit_monthly: freePlan.dmca_takedown_limit_monthly,
        });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 預設試用30天

        await UserSubscription.create({
            user_id: newUser.id,
            plan_id: freePlan.id,
            status: 'active',
            started_at: new Date(),
            expires_at: expiresAt,
        });
        
        logger.info(`[Register] New user registered successfully: ${newUser.email}`);
        res.status(201).json({ message: '註冊成功！請前往登入。' });

    } catch (error) {
        logger.error('[Register] Error:', { message: error.message, original: error.original?.message });
        res.status(500).json({ message: '伺服器註冊時發生錯誤。' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
        return res.status(400).json({ message: '請提供帳號和密碼。' });
    }

    try {
        const user = await User.findOne({
             where: { 
                [Op.or]: [{ email: identifier }, { phone: identifier }],
                role: 'user'
             }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: '帳號或密碼錯誤' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        
        res.json({
            message: '登入成功',
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });

    } catch (error) {
        logger.error('[Login] Error:', error);
        res.status(500).json({ message: '伺服器登入時發生錯誤。'});
    }
});

module.exports = router;
