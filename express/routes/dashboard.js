const express = require('express');
const { Op } = require('sequelize');
const { UserSubscriptions, SubscriptionPlans, UsageRecord, File, Scan } = require('../models');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const active = await UserSubscriptions.findOne({
      where: { user_id: userId, status: 'active' },
      include: { model: SubscriptionPlans, as: 'plan' }
    });
    if (!active) return res.status(404).json({ error: 'No active subscription.' });
    const plan = active.plan;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [imgUsed, scanUsed, dmcaUsed] = await Promise.all([
      UsageRecord.count({ where: { user_id: userId, feature_code: 'image_upload', created_at: { [Op.gte]: startOfMonth } } }),
      UsageRecord.count({ where: { user_id: userId, feature_code: 'scan', created_at: { [Op.gte]: startOfMonth } } }),
      UsageRecord.count({ where: { user_id: userId, feature_code: 'dmca_takedown', created_at: { [Op.gte]: startOfMonth } } })
    ]);
    const recentProtectedFiles = await File.findAll({ where: { user_id: userId }, order: [['createdAt','DESC']], limit: 5 });
    const recentScans = await Scan.findAll({
      include: { model: File, as: 'file', where: { user_id: userId } },
      order: [['createdAt','DESC']],
      limit: 5
    });
    res.json({
      plan: plan.name,
      expires_at: active.expires_at,
      usage: {
        videos: { used: 0, limit: plan.video_limit },
        images: { used: imgUsed, limit: plan.image_limit || plan.image_upload_limit },
        scans: { used: scanUsed, frequency: plan.scan_frequency || `${plan.scan_frequency_in_hours}h` },
        certificates: { used: 0, unlimited: true },
        dmca: { used: dmcaUsed, free_limit: plan.dmca_free || plan.dmca_takedown_limit_monthly }
      },
      protectedContent: recentProtectedFiles,
      recentScans
    });
  } catch (err) {
    console.error('[Dashboard]', err);
    res.status(500).json({ error: 'Failed to load dashboard data.' });
  }
});

module.exports = router;
