const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const {
  User,
  SubscriptionPlan,
  UserSubscription,
  File,
  Scan,
  PaymentProof,
  ContactSubmission,
  sequelize
} = require('../models');
const logger = require('../utils/logger');
const adminAuth = require('../middleware/adminAuth');

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-strong-secret-key-for-dev';

router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ error: '缺少帳號或密碼' });
        
        const user = await User.findOne({
            where: { [Op.or]: [{ email: identifier }, { phone: identifier }], role: 'admin' }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '帳號或密碼錯誤，或非管理員帳號' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ message: 'Admin 登入成功', token, user: { name: user.real_name, role: user.role } });
    } catch (err) {
        return res.status(500).json({ error: '登入過程發生錯誤' });
    }
});

router.use(adminAuth);

// --- 核心數據 API ---
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

router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['password'] },
            include: [{
                model: UserSubscription,
                as: 'UserSubscriptions',
                where: { status: 'active' },
                required: false,
                include: [{ model: SubscriptionPlan, as: 'SubscriptionPlan' }]
            }]
        });
        res.json(users);
    } catch (err) {
        logger.error('[Admin Users] Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 新增使用者
router.post('/users', async (req, res) => {
    const { real_name, email, phone, password, role = 'member' } = req.body;
    if (!real_name || !email || !phone || !password) {
        return res.status(400).json({ error: '所有欄位皆為必填' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ real_name, email, phone, password: hashedPassword, role, status: 'active' });
        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).json({ error: '建立使用者失敗' });
    }
});

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

// --- 使用者管理進階功能 ---
router.put('/users/:userId/details', async (req, res) => {
    try {
        const { real_name, email, phone, status, role, quota, image_upload_limit, scan_limit, dmca_limit, p2p_limit } = req.body;
        const user = await User.findByPk(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.real_name = real_name ?? user.real_name;
        user.email = email ?? user.email;
        user.phone = phone ?? user.phone;
        user.status = status ?? user.status;
        user.role = role ?? user.role;
        user.quota = quota ?? user.quota;
        user.image_upload_limit = image_upload_limit ?? user.image_upload_limit;
        user.scan_limit = scan_limit ?? user.scan_limit;
        user.dmca_limit = dmca_limit ?? user.dmca_limit;
        user.p2p_limit = p2p_limit ?? user.p2p_limit;

        await user.save();
        res.json({ message: 'User details updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user details.' });
    }
});

router.put('/users/:userId/password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        const user = await User.findByPk(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: `Password for ${user.email} has been reset.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

router.post('/users/:userId/subscription', async (req, res) => {
    const { planCode } = req.body;
    try {
        const user = await User.findByPk(req.params.userId);
        const plan = await SubscriptionPlan.findOne({ where: { plan_code: planCode } });
        if (!user || !plan) return res.status(404).json({ error: 'User or plan not found' });

        await user.update({ role: 'member', quota: (user.quota || 0) + (plan.works_quota || 0) });
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await UserSubscription.create({ user_id: user.id, plan_id: plan.id, status: 'active', started_at: new Date(), expires_at: expiresAt });
        res.json({ message: `已為 ${user.email} 開通 ${plan.name} 方案` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update subscription.' });
    }
});

router.get('/contact-submissions', async (req, res) => {
    try {
        const submissions = await ContactSubmission.findAll({ where: { status: 'new' }, order: [['createdAt', 'DESC']] });
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch contact submissions.' });
    }
});

// ★★★ 恢復遺失的 /files 路由 ★★★
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

// ★★★ 恢復遺失的 /scans 路由 ★★★
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


// --- 付款審核 API ---
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
            quota: (user.quota || 0) + (plan.works_quota || 0)
        }, { transaction });
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await UserSubscription.create({
            user_id: user.id, plan_id: plan.id, status: 'active',
            started_at: new Date(), expires_at: expiresAt
        }, { transaction });
        await proof.update({ status: 'approved', approved_by: req.user.id }, { transaction });
        await transaction.commit();
        res.json({ message: `已成功為 ${user.email} 開通 ${plan.name} 方案` });
    } catch (err) {
        await transaction.rollback();
        res.status(500).json({ error: '批准付款時發生錯誤' });
    }
});

module.exports = router;
