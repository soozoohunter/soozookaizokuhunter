// express/routes/dashboard.js (最終功能版)
const express = require('express');
const { Op } = require('sequelize');
const { User, UserSubscription, SubscriptionPlan, UsageRecord, File, Scan } = require('../models');
const auth = require('../middleware/auth.js');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [user, activeSubscription, imageUsage, scanUsage, dmcaUsage] = await Promise.all([
        User.findByPk(userId),
        UserSubscription.findOne({
            where: { user_id: userId, status: 'active' },
            include: { model: SubscriptionPlan, as: 'plan' }
        }),
        File.count({ where: { user_id: userId } }),
        Scan.count({
            where: { '$file.user_id$': userId, createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
            include: { model: File, as: 'file', attributes: [] }
        }),
        UsageRecord.count({ where: { user_id: userId, feature_code: 'dmca_takedown', created_at: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } })
    ]);

    let plan = activeSubscription?.plan || { name: 'Free Trial', image_limit: 5, scan_limit_monthly: 10, dmca_takedown_limit_monthly: 0 };

    const protectedFiles = await File.findAll({ where: { user_id: userId }, order: [['createdAt', 'DESC']], limit: 50 });
    const fileIds = protectedFiles.map(f => f.id);
    const scans = await Scan.findAll({ where: { file_id: { [Op.in]: fileIds } }, order: [['createdAt', 'DESC']]});

    const scansByFileId = scans.reduce((acc, scan) => {
        (acc[scan.file_id] = acc[scan.file_id] || []).push(scan);
        return acc;
    }, {});

    res.json({
      userInfo: { id: user.id, email: user.email, realName: user.realName },
      planInfo: { name: plan.name, expires_at: activeSubscription?.expires_at },
      usage: {
        images: { used: imageUsage, limit: plan.image_limit ?? 5 },
        monthlyScan: { used: scanUsage, limit: plan.scan_limit_monthly ?? 10 },
        monthlyDmca: { used: dmcaUsage, limit: plan.dmca_takedown_limit_monthly ?? 0 },
      },
      protectedContent: protectedFiles.map(file => ({
        fileId: file.id,
        fileName: file.filename,
        uploadDate: file.createdAt,
        thumbnailUrl: file.thumbnail_path ? `${process.env.PUBLIC_HOST}${file.thumbnail_path}` : null,
        fingerprint: file.fingerprint,
        ipfsHash: file.ipfs_hash,
        txHash: file.tx_hash,
        scans: scansByFileId[file.id] || []
      }))
    });
  } catch (err) {
    logger.error(`[Dashboard API Error] For user ${req.user?.id}:`, err);
    res.status(500).json({ error: 'Failed to load dashboard data.' });
  }
});

module.exports = router;
