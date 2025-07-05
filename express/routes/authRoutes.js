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
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ message: 'Email, password, and username (phone) are required.' });
    }

    try {
        // [強化] 檢查使用者是否已存在
        const existingUser = await User.findOne({
            where: { [Op.or]: [{ email }, { phone: username }] }
        });

        if (existingUser) {
            return res.status(409).json({ message: '此 Email 或手機號碼已被註冊。' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const freePlan = await SubscriptionPlan.findOne({ where: { plan_code: 'free_trial' } });
        if (!freePlan) {
            logger.error('[Register] CRITICAL: free_trial plan not found in database.');
            return res.status(500).json({ message: 'Server configuration error.' });
        }

        const newUser = await User.create({
            ...req.body, // 傳入所有表單欄位
            phone: username, // 將 username (手機) 存入 phone 欄位
            password: hashedPassword,
            role: 'user',
            status: 'active',
            // 根據免費方案設定預設額度
            image_upload_limit: freePlan.image_limit,
            scan_limit_monthly: freePlan.scan_limit_monthly,
            dmca_takedown_limit_monthly: freePlan.dmca_takedown_limit_monthly,
            scan_usage_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        });

        // 為新使用者建立訂閱紀錄
        await UserSubscription.create({
            user_id: newUser.id,
            plan_id: freePlan.id,
            status: 'active',
            started_at: new Date(),
            expires_at: new Date(new Date().setDate(new Date().getDate() + 30)), // 試用30天
        });
        
        logger.info(`[Register] New user registered successfully: ${newUser.email}`);
        res.status(201).json({ message: '註冊成功！請前往登入。' });

    } catch (error) {
        // [強化] 記錄下來自資料庫的、最原始的錯誤訊息
        logger.error('[Register] Error during registration:', {
            message: error.message,
            originalError: error.original?.message,
            stack: error.stack,
        });
        res.status(500).json({ message: '伺服器註冊時發生錯誤。' });
    }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const user = await User.findOne({
             where: { [Op.or]: [{ email: identifier }, { username: identifier }] }
        });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: '帳號或密碼錯誤' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: '登入成功', token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        logger.error('[Login] Error:', error);
        res.status(500).json({ message: '伺服器登入時發生錯誤。'});
    }
});

module.exports = router;
