// middleware/planMiddleware.js
const plans = require('../config/plans');
const User = require('../models/User');

function planMiddleware(action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const userPlan = req.user.plan;  // JWT payload裡可能帶了plan
      const planConfig = plans[userPlan];
      if (!planConfig) {
        return res.status(400).json({ message: '無效的用戶方案' });
      }

      // 從資料庫取得最新的使用次數（為確保即時性）
      const user = await User.findById(userId).select('uploadsUsed apiCallsUsed plan');
      if (!user) {
        return res.status(401).json({ message: '使用者不存在或未授權' });
      }

      // 根據不同action檢查對應的限制
      if (action === 'upload') {
        if (user.uploadsUsed >= planConfig.uploadLimit) {
          return res.status(403).json({ message: '已達上傳次數上限，請升級方案以獲得更多配額' });
        }
      } else if (action === 'api') {
        if (user.apiCallsUsed >= planConfig.apiLimit) {
          return res.status(403).json({ message: '已達API訪問次數上限，請升級方案' });
        }
      }
      // 通過檢查，交由後續處理
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = planMiddleware;
