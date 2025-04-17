/********************************************************************
 * middleware/planMiddleware.js
 * 根據用戶 plan 檢查上傳 / API 次數限制
 ********************************************************************/
const { User } = require('../models');
// 請確保您有 express/config/plans.js 或類似檔案
const plans = require('../config/plans');

function planMiddleware(action) {
  return async (req, res, next) => {
    try {
      // 取出 userId (假設事先透過 authMiddleware 解析JWT)
      const userId = req.user.userId;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(403).json({ error: '使用者不存在' });
      }

      // 取得當前用戶的方案設定
      const planConfig = plans[user.plan] || plans['free'];
      if (!planConfig) {
        return res.status(400).json({ error: '無效的 plan' });
      }

      if (action === 'upload') {
        // 檢查上傳次數 (示例)
        if (user.uploadVideos >= planConfig.uploadLimit) {
          return res.status(403).json({ error: '已達上傳次數限制' });
        }
      } else if (action === 'api') {
        // 若要檢查API次數可自行加
        // if (user.apiCalls >= planConfig.apiLimit) ...
      }

      return next();
    } catch (err) {
      console.error('[planMiddleware] error:', err);
      return res.status(500).json({ error: err.message });
    }
  };
}

module.exports = planMiddleware;
