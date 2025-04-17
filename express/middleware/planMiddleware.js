/********************************************************************
 * middleware/planMiddleware.js (Enterprise-Ready Version)
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
        console.warn('[planMiddleware] User not found, userId=', userId);
        return res.status(403).json({ error: '使用者不存在' });
      }

      const planConfig = plans[user.plan] || plans['free'];
      if (!planConfig) {
        console.error('[planMiddleware] Invalid plan:', user.plan);
        return res.status(400).json({ error: '無效方案' });
      }

      if (action === 'upload') {
        if (
          user.uploadVideos >= planConfig.uploadLimit &&
          user.uploadImages >= planConfig.uploadLimitImages
        ) {
          console.warn(`[planMiddleware] User (ID=${user.id}) reached upload limit.`);
          return res.status(403).json({
            error: '已達上傳次數限制，請升級方案'
          });
        }

        // 若要回傳剩餘次數
        const videosLeft = planConfig.uploadLimit - user.uploadVideos;
        const imagesLeft = planConfig.uploadLimitImages - user.uploadImages;
        req.usageLeft = {
          videos: videosLeft < 0 ? 0 : videosLeft,
          images: imagesLeft < 0 ? 0 : imagesLeft
        };

        console.log(`[planMiddleware] Plan=${user.plan}, videosLeft=${videosLeft}, imagesLeft=${imagesLeft}`);

      } else if (action === 'api') {
        // if (user.apiCallsUsed >= planConfig.apiLimit) {
        //   return res.status(403).json({ error: 'API 次數已達上限，請升級方案' });
        // }
      }

      return next();
    } catch (err) {
      console.error('[planMiddleware] error:', err);
      return res.status(500).json({ error: err.message });
    }
  };
}

module.exports = planMiddleware;
