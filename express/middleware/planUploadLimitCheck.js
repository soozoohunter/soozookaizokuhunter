// express/middleware/planUploadLimitCheck.js
const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    const user = await User.findByPk(req.user.userId || req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // define usage limit by plan
    const plan = user.plan || 'BASIC';
    let maxVideo = 3, maxImage = 10;
    let allowDMCA = false;

    switch (plan) {
      case 'BASIC':
        maxVideo = 3;   // 首月免費
        maxImage = 10;
        allowDMCA = false;
        break;
      case 'ADVANCED':
        maxVideo = 10;
        maxImage = 25;
        allowDMCA = true;
        break;
      case 'PRO':
        maxVideo = 20;
        maxImage = 50;
        allowDMCA = true;
        break;
      case 'ENTERPRISE':
        maxVideo = 9999;
        maxImage = 9999;
        allowDMCA = true;
        break;
      default:
        // fallback
        maxVideo = 3;
        maxImage = 10;
        allowDMCA = false;
    }

    // example usage
    if (user.uploadVideos > maxVideo) {
      return res.status(403).json({ error:`影片已達上限(${maxVideo})` });
    }
    if (user.uploadImages > maxImage) {
      return res.status(403).json({ error:`圖片已達上限(${maxImage})` });
    }

    // 存 allowDMCA 供後續路由檢查
    req.userPlan = { allowDMCA, maxVideo, maxImage };
    next();
  } catch(e) {
    console.error('[planUploadLimitCheck] error:', e);
    return res.status(500).json({ error:e.message });
  }
};
