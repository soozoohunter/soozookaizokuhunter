/**
 * controllers/membershipController.js
 * 若您習慣將 membership 邏輯提取到 controller
 */
const { User } = require('../models');
const logger = require('../utils/logger');

exports.getStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error:'使用者不存在' });
    }
    return res.json({
      email: user.email,
      userName: user.userName,
      plan: user.plan,
      uploadVideos: user.uploadVideos,
      uploadImages: user.uploadImages
      // ...
    });
  } catch (err) {
    logger.error('Error fetching membership status:', err);
    return res.status(500).json({ error:'Server error retrieving membership' });
  }
};

exports.upgradePlan = async (req, res) => {
  try {
    const { targetPlan } = req.body;
    if(!targetPlan) {
      return res.status(400).json({ error:'缺少 targetPlan' });
    }
    // 新增 ADVANCED
    if(!['ADVANCED','PRO','ENTERPRISE'].includes(targetPlan)){
      return res.status(400).json({ error:'無效的方案' });
    }

    const user = await User.findByPk(req.user.userId);
    if(!user){
      return res.status(404).json({ error:'使用者不存在' });
    }

    user.plan = targetPlan;
    await user.save();
    return res.json({
      message:`已升級為 ${targetPlan} 方案`,
      plan: user.plan
    });
  } catch (err) {
    logger.error('[upgradePlan]', err);
    return res.status(500).json({ error:'Server error upgrading plan' });
  }
};
