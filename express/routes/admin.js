const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, SubscriptionPlan, UserSubscription, File, Scan, PaymentProof, sequelize } = require('../models');
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

// ★★★ 新增：獲取待審核的付款證明 ★★★
router.get('/payment-proofs', async (req, res) => {
    try {
        const proofs = await PaymentProof.findAll({
            where: { status: 'pending' },
            include: [{ model: User, attributes: ['id', 'email', 'real_name'] }],
            order: [['createdAt', 'ASC']]
        });
        res.json(proofs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payment proofs' });
    }
});

// ★★★ 新增：批准付款並開通會員方案 ★★★
router.post('/approve-payment/:proofId', async (req, res) => {
    const { proofId } = req.params;
    const transaction = await sequelize.transaction();

    try {
        const proof = await PaymentProof.findByPk(proofId, { transaction });
        if (!proof || proof.status !== 'pending') {
            await transaction.rollback();
            return res.status(404).json({ message: '找不到待審核的紀錄或已被處理' });
        }

        const user = await User.findByPk(proof.user_id, { transaction });
        const plan = await SubscriptionPlan.findOne({ where: { plan_code: proof.plan_code }, transaction });

        if (!user || !plan) {
            await transaction.rollback();
            return res.status(404).json({ message: '找不到對應的使用者或方案' });
        }

        await user.update({
            role: 'member',
            quota: user.quota + plan.image_limit
        }, { transaction });

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await UserSubscription.create({
            user_id: user.id,
            plan_id: plan.id,
            status: 'active',
            started_at: new Date(),
            expires_at: expiresAt
        }, { transaction });

        await proof.update({ status: 'approved', approved_by: req.user.id }, { transaction });

        await transaction.commit();

        res.json({ message: `已成功為 ${user.email} 開通 ${plan.plan_name} 方案` });
    } catch (err) {
        await transaction.rollback();
        res.status(500).json({ error: '批准付款時發生錯誤' });
    }
});

module.exports = router;
