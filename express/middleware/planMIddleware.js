/********************************************************************
 * middleware/planMiddleware.js
 * 根據用戶 plan 檢查上傳 / API 次數限制
 ********************************************************************/
const { User } = require('../models');
const plans = require('../config/plans');

function planMiddleware(action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId; // 假設您在 authMiddleware 已將 userId 存在 req.user 中
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(403).json({ error: '使用者不存在' });
      }

      // 取得當前用戶的方案配置，若找不到則用 free
      const planConfig = plans[user.plan] || plans['free'];
      if (!planConfig) {
        return res.status(400).json({ error: '無效方案' });
      }

      // 針對不同 action 執行方案限制檢查
      if (action === 'upload') {
        // 假設 user 資料庫中有 uploadVideos / uploadImages 欄位
        if (
          user.uploadVideos >= planConfig.uploadLimit &&
          user.uploadImages >= planConfig.uploadLimitImages
        ) {
          return res.status(403).json({ error: '已達上傳次數限制，請升級方案' });
        }
      } else if (action === 'api') {
        // if (user.apiCallsUsed >= planConfig.apiLimit) {
        //   return res.status(403).json({ error: '已達 API 次數限制，請升級方案' });
        // }
      }

      // 若限制檢查通過，繼續後續流程
      return next();
    } catch (err) {
      console.error('[planMiddleware] error:', err);
      return res.status(500).json({ error: err.message });
    }
  };
}

module.exports = planMiddleware;
