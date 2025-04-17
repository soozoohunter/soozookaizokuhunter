/********************************************************************
 * middleware/planMiddleware.js
 * 根據用戶 plan 檢查上傳 / API 次數限制
 ********************************************************************/
const { User } = require('../models');
const plans = require('../config/plans');

function planMiddleware(action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(403).json({ error: '使用者不存在' });
      }

      // 取得當前用戶的方案配置，若找不到則預設 free
      const planConfig = plans[user.plan] || plans['free'];
      if (!planConfig) {
        return res.status(400).json({ error: '無效方案' });
      }

      if (action === 'upload') {
        // 簡單檢查上傳次數 (假設 user.uploadVideos 與 user.uploadImages 是資料庫欄位)
        if (
          user.uploadVideos >= planConfig.uploadLimit &&
          user.uploadImages >= planConfig.uploadLimitImages
        ) {
          return res.status(403).json({ error: '已達上傳次數限制，請升級方案' });
        }
      } else if (action === 'api') {
        // 若要檢查 API 次數，您可自行加上邏輯
        // if (user.apiCallsUsed >= planConfig.apiLimit) {
        //   return res.status(403).json({ error: '已達 API 次數限制，請升級方案' });
        // }
      }

      // 檢查通過
      return next();
    } catch (err) {
      console.error('[planMiddleware] error:', err);
      return res.status(500).json({ error: err.message });
    }
  };
}

module.exports = planMiddleware;
