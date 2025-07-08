// express/routes/authRoutes.js (最終安全版)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, SubscriptionPlan, UserSubscription } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

// --- 使用者註冊 API ---
router.post('/register', async (req, res) => {
    const { email, phone, password, realName, birthDate, address, socialAccounts } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: '電子郵件和密碼為必填項。' });
    }

    try {
        const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
        if (existingUser) {
            return res.status(409).json({ error: '此電子郵件或手機號碼已被註冊。' });
        }

        // [FIX] 在儲存前，務必將密碼進行加密
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            phone,
            password: hashedPassword, // 儲存加密後的密碼
            realName,
            birthDate,
            address,
            socialAccounts,
            role: 'user', // 預設角色為 'user'
            status: 'active'
        });

        // 為新使用者自動指派免費試用方案
        const freePlan = await SubscriptionPlan.findOne({ where: { plan_code: 'free_trial' } });
        if (freePlan) {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1); // 免費試用一個月

            await UserSubscription.create({
                user_id: newUser.id,
                plan_id: freePlan.id,
                status: 'active',
                started_at: new Date(),
                expires_at: expiresAt,
            });
            
            // 同步更新 User 表上的額度快取
            newUser.image_upload_limit = freePlan.image_limit;
            newUser.scan_limit_monthly = freePlan.scan_limit_monthly;
            newUser.dmca_takedown_limit_monthly = freePlan.dmca_takedown_limit_monthly;
            await newUser.save();
        }

        logger.info(`[Register] New user registered successfully: ${email}`);
        res.status(201).json({ message: '註冊成功！', userId: newUser.id });

    } catch (error) {
        logger.error('[Register API Error]', error);
        res.status(500).json({ error: '伺服器錯誤，註冊失敗。' });
    }
});

// --- 使用者登入 API ---
router.post('/login', async (req, res) => {
    const { account, password } = req.body;

    if (!account || !password) {
        return res.status(400).json({ error: '帳號和密碼為必填項。' });
    }

    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [{ email: account }, { phone: account }],
                role: 'user' // 確保只有普通使用者能從此處登入
            }
        });

        // [FIX] 使用 bcrypt.compare 來比對加密後的密碼
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '帳號或密碼錯誤。' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' } // 普通使用者 token 效期 24 小時
        );

        res.json({ message: '登入成功', token });

    } catch (error) {
        logger.error('[Login API Error]', error);
        res.status(500).json({ error: '伺服器錯誤，登入失敗。' });
    }
});

module.exports = router;
