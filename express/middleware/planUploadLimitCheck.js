/********************************************************************
 * middleware/planUploadLimitCheck.js
 * 依 "BASIC / ADVANCED / PRO / ENTERPRISE" 不同的計畫檢查使用者上傳次數
 ********************************************************************/
const { User } = require('../models');
const plans = require('../config/plans'); // 同樣從 plans.js 讀取

module.exports = async function (req, res, next) {
  try {
    // 假設在 authMiddleware 已經把 userId 放進 req.user
    const user = await User.findByPk(req.user.userId || req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 讀取資料庫中的 plan，可能是 'BASIC','ADVANCED','PRO','ENTERPRISE'
    const planKey = user.plan || 'BASIC';
    const planConfig = plans[planKey] || plans['BASIC'];

    // 取出對應數值
    const maxVideo = planConfig.maxVideo || 3;
    const maxImage = planConfig.maxImage || 10;
    const allowDMCA = planConfig.allowDMCA || false;

    // 檢查上傳次數
    if (user.uploadVideos > maxVideo) {
      return res.status(403).json({ error: `影片已達上限(${maxVideo})` });
    }
    if (user.uploadImages > maxImage) {
      return res.status(403).json({ error: `圖片已達上限(${maxImage})` });
    }

    // 將 allowDMCA 等資訊存到 req.userPlan 供後續使用
    req.userPlan = { allowDMCA, maxVideo, maxImage };

    return next();
  } catch (e) {
    console.error('[planUploadLimitCheck] error:', e);
    return res.status(500).json({ error: e.message });
  }
};
