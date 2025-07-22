const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, SubscriptionPlan, UserSubscription, File, Scan } = require('../models');
const adminAuth = require('../middleware/adminAuth'); // 確保您已建立此管理員專用中介層

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-strong-secret-key-for-dev';

// 管理員登入 API
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ error: '缺少帳號或密碼' });
        }
        const user = await User.findOne({
            where: {
                [Op.or]: [{ email: identifier }, { phone: identifier }],
                role: 'admin'
            }
        });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '帳號或密碼錯誤，或非管理員帳號' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ message: 'Admin 登入成功', token, user: { name: user.real_name, role: user.role } });
    } catch (err) {
        console.error('[AdminLogin Error]', err);
        return res.status(500).json({ error: '登入過程發生錯誤' });
    }
});

// === 以下所有 API 都需要先通過管理員驗證 ===
router.use(adminAuth);

// 獲取儀表板總覽數據
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.count({ where: { role: {[Op.ne]: 'trial'} } });
        const trialUsers = await User.count({ where: { role: 'trial' } });
        const totalFiles = await File.count();
        const totalScans = await Scan.count({ where: { status: 'completed' } });
        res.json({ totalUsers, trialUsers, totalFiles, totalScans });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// 獲取所有使用者列表 (包括試用者)
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['password'] } // 不回傳密碼
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 獲取單一使用者的詳細資訊 (包含檔案和訂閱)
router.get('/users/:userId/details', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.userId, {
            attributes: { exclude: ['password'] },
            include: [
                { model: File, as: 'Files', order: [['createdAt', 'DESC']] },
                { model: UserSubscription, as: 'UserSubscriptions', include: [{ model: SubscriptionPlan, as: 'SubscriptionPlan' }] }
            ]
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// 獲取所有檔案列表
router.get('/files', async (req, res) => {
    try {
        const files = await File.findAll({
            order: [['createdAt', 'DESC']],
            include: { model: User, attributes: ['id', 'email', 'real_name'] }
        });
        res.json(files);
    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// 獲取所有掃描任務列表
router.get('/scans', async (req, res) => {
    try {
        const scans = await Scan.findAll({
            order: [['createdAt', 'DESC']],
            include: [{ model: File, attributes: ['id', 'filename'] }, { model: User, attributes: ['id', 'email'] }]
        });
        res.json(scans);
    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch scans' });
    }
});

// 更新使用者資訊 (角色、狀態、額度等)
router.put('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, status, quota } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (role) user.role = role;
        if (status) user.status = status;
        if (quota) user.quota = quota;
        
        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

module.exports = router;
