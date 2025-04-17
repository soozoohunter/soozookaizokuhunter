/********************************************************************
 * middleware/planMiddleware.js (Enterprise-Ready Version)
 * 根據用戶 plan 檢查上傳 / API 次數限制
 *
 * 1. 保留您原有的檔案與程式碼完全不變
 * 2. 額外新增 usageLeft / 企業級註解與日誌紀錄
 ********************************************************************/
const { User } = require('../models');
const plans = require('../config/plans');

function planMiddleware(action) {
  return async (req, res, next) => {
    try {
      // 取得目前使用者ID (authMiddleware 已將 userId 存入 req.user)
      const userId = req.user.userId;
      const user = await User.findByPk(userId);
      if (!user) {
        // 企業級示範：可記錄警告日誌
        console.warn('[planMiddleware] User not found, userId=', userId);
        return res.status(403).json({ error: '使用者不存在' });
      }

      // 取得當前用戶的方案配置，若找不到則預設 'free'
      const planConfig = plans[user.plan] || plans['free'];
      if (!planConfig) {
        console.error('[planMiddleware] Invalid plan:', user.plan);
        return res.status(400).json({ error: '無效方案' });
      }

      // =================================================
      // action === 'upload' => 檢查上傳次數
      // =================================================
      if (action === 'upload') {
        // 假設 user.uploadVideos / user.uploadImages 來紀錄使用量
        if (
          user.uploadVideos >= planConfig.uploadLimit &&
          user.uploadImages >= planConfig.uploadLimitImages
        ) {
          console.warn(`[planMiddleware] User (ID=${user.id}) reached upload limit.`);
          return res.status(403).json({
            error: '已達上傳次數限制，請升級方案'
          });
        }

        // === [Enterprise級] 可計算剩餘可用量並帶給後續使用 ===
        const videosLeft = planConfig.uploadLimit - user.uploadVideos;
        const imagesLeft = planConfig.uploadLimitImages - user.uploadImages;
        req.usageLeft = {
          videos: videosLeft < 0 ? 0 : videosLeft,
          images: imagesLeft < 0 ? 0 : imagesLeft
        };

        // 您可選擇在此記錄詳細日誌
        console.log(`[planMiddleware] Plan=${user.plan}, videosLeft=${videosLeft}, imagesLeft=${imagesLeft}`);

      // =================================================
      // action === 'api' => 檢查 API 次數
      // =================================================
      } else if (action === 'api') {
        // 若要檢查 API 次數，可自行加上邏輯
        // if (user.apiCallsUsed >= planConfig.apiLimit) {
        //   console.warn(`[planMiddleware] User (ID=${user.id}) reached API limit.`);
        //   return res.status(403).json({
        //     error: '已達 API 次數限制，請升級方案'
        //   });
        // }

        // === [Enterprise級] 計算剩餘 API 次數示例 ===
        // const apiLeft = planConfig.apiLimit - user.apiCallsUsed;
        // req.usageLeft = { apiCalls: apiLeft < 0 ? 0 : apiLeft };
      }

      // 若檢查通過 => 執行下一步
      return next();

    } catch (err) {
      // 企業級紀錄錯誤
      console.error('[planMiddleware] error:', err);
      return res.status(500).json({ error: err.message });
    }
  };
}

module.exports = planMiddleware;
