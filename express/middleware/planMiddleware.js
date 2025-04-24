// express/middleware/planMiddleware.js
const { User } = require('../models');
const plans = require('../config/plans'); // 內含各方案設定

function planMiddleware(action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(403).json({ error: '使用者不存在' });
      }

      // 讀取對應方案 (free / premium / enterprise ...)
      const planConfig = plans[user.plan] || plans['free'];
      if (!planConfig) {
        return res.status(400).json({ error: '無效方案' });
      }

      if (action === 'upload') {
        // 假設 planConfig.uploadLimit & planConfig.uploadLimitImages
        if (
          user.uploadVideos >= planConfig.uploadLimit &&
          user.uploadImages >= planConfig.uploadLimitImages
        ) {
          return res.status(403).json({
            error: '已達上傳次數限制，請升級方案',
          });
        }
      }

      // 通過
      return next();
    } catch (err) {
      console.error('[planMiddleware]', err);
      return res.status(500).json({ error: err.message });
    }
  };
}

module.exports = planMiddleware;
