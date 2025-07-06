// express/routes/dashboard.js (語法修正最終版)
// =================== 檔案開始 ===================

const express = require('express');
const { Op } = require('sequelize');
const { User, UserSubscription, SubscriptionPlan, UsageRecord, File, Scan } = require('../models');
const auth = require('../middleware/auth.js');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in token.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const activeSubscription = await UserSubscription.findOne({
      where: { user_id: userId, status: 'active' },
      include: { model: SubscriptionPlan, as: 'plan' }
    });

    let plan, expires_at;
    if (activeSubscription && activeSubscription.plan) {
        plan = activeSubscription.plan;
        expires_at = activeSubscription.expires_at;
    } else {
        logger.warn(`User ${userId} has no active subscription, providing default free plan data.`);
        plan = {
            name: 'Free Trial',
            image_limit: 5,
            scan_limit_monthly: 10,
            dmca_takedown_limit_monthly: 0,
        };
        expires_at = null;
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const [imageUsage, scanUsage, dmcaUsage] = await Promise.all([
      File.count({ where: { user_id: userId } }),
      Scan.count({ 
          where: { createdAt: { [Op.gte]: startOfMonth } },
          include: [{ model: File, as: 'file', where: { user_id: userId }, attributes: [] }]
      }),
      UsageRecord.count({ where: { user_id: userId, feature_code: 'dmca_takedown', created_at: { [Op.gte]: startOfMonth } } })
    ]);

    const recentProtectedFiles = await File.findAll({ 
        where: { user_id: userId }, 
        order: [['createdAt', 'DESC']], 
        limit: 10 // 可以考慮顯示更多
    });

    const fileIds = recentProtectedFiles.map(f => f.id);
    const scans = await Scan.findAll({ where: { file_id: { [Op.in]: fileIds } } });

    const scansByFileId = scans.reduce((acc, scan) => {
        if (!acc[scan.file_id]) {
            acc[scan.file_id] = [];
        }
        acc[scan.file_id].push(scan);
        return acc;
    }, {});

    res.json({
      userInfo: {
        id: user.id,
        email: user.email,
        realName: user.realName,
      },
      planInfo: {
        name: plan.name,
        expires_at: expires_at,
      },
      usage: {
        images: { used: imageUsage, limit: plan.image_limit ?? 5 },
        monthlyScan: { used: scanUsage, limit: plan.scan_limit_monthly ?? 10 },
        monthlyDmca: { used: dmcaUsage, limit: plan.dmca_takedown_limit_monthly ?? 0 },
      },
      protectedContent: recentProtectedFiles.map(file => ({
        fileId: file.id,
        fileName: file.filename,
        uploadDate: file.createdAt,
        thumbnailUrl: `${process.env.PUBLIC_HOST}${file.thumbnail_path}`,
        fingerprint: file.fingerprint,
        ipfsHash: file.ipfs_hash,
        txHash: file.tx_hash,
        scans: scansByFileId[file.id] || []
      }))
    });

  } catch (err) {
    logger.error(`[Dashboard API Error] Failed to load dashboard for user ${req.user.id || 'unknown'}:`, err);
    res.status(500).json({ error: 'Failed to load dashboard data.' });
  }
});

module.exports = router;

// =================== 檔案結束 ===================
