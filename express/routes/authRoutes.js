// express/routes/authRoutes.js (修正版)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, SubscriptionPlan, UserSubscription } = require('../models');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password, username, realName, phone, ig, fb } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ message: 'Email, password, and username (phone) are required.' });
    }

    try {
        // 檢查使用者是否已存在
        const existingUser = await User.findOne({
            where: { [Op.or]: [{ email }, { phone: username }] }
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Email or phone number already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 尋找預設的免費方案
        const freePlan = await SubscriptionPlan.findOne({ where: { plan_code: 'free_trial' } });
        if (!freePlan) {
            logger.error('[Register] CRITICAL: free_trial plan not found in database. Cannot register new users.');
            return res.status(500).json({ message: 'Server configuration error: default plan not found.' });
        }

        // 建立新使用者，並設定預設值
        const newUser = await User.create({
            email,
            password: hashedPassword,
            username,
            phone: username, // 假設 username 就是 phone
            realName,
            IG: ig,
            FB: fb,
            role: 'user',
            status: 'active',
            image_upload_limit: freePlan.image_limit,
            scan_limit_monthly: freePlan.scan_limit_monthly,
            dmca_takedown_limit_monthly: freePlan.dmca_takedown_limit_monthly,
        });

        // 為新使用者建立一筆有效的訂閱紀錄
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 免費試用 30 天

        await UserSubscription.create({
            user_id: newUser.id,
            plan_id: freePlan.id,
            status: 'active',
            started_at: new Date(),
            expires_at: expiresAt,
        });
        
        logger.info(`[Register] New user registered successfully: ${newUser.email} (ID: ${newUser.id})`);
        res.status(201).json({ message: 'Registration successful' });

    } catch (error) {
        logger.error('[Register] Error during registration:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});


// POST /api/auth/login (保持不變)
router.post('/login', async (req, res) => { /* ... */ });

module.exports = router;
