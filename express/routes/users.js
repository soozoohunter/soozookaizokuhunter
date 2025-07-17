const express = require('express');
const router = express.Router();
const { User, APIKey } = require('../models'); // 確保從模型中導入 User 和 APIKey
const auth = require('../middleware/auth'); // 確保您的 auth 中介軟體路徑正確

// @route   GET /api/users/profile
// @desc    Get current logged-in user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'realName', 'email', 'phone'],
      include: [{
        model: APIKey,
        as: 'apiKeys', // 假設您在模型中設定了關聯別名
        attributes: ['service', 'value'] // 注意：出於安全，通常不直接返回金鑰值
      }]
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Failed to retrieve user profile:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

// @route   POST /api/users/api-keys
// @desc    Save or update user's API keys
// @access  Private
router.post('/api-keys', auth, async (req, res) => {
    const { keys } = req.body;
    const userId = req.user.id; // 從 JWT 中介軟體獲取用戶 ID

    if (!keys || typeof keys !== 'object') {
        return res.status(400).json({ error: '無效的金鑰格式' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: '找不到用戶' });
        }

        // 使用 Promise.all 平行處理所有金鑰的更新或創建
        await Promise.all(
            Object.entries(keys).map(async ([service, value]) => {
                if (typeof value !== 'string') return; // 跳過無效值

                // 使用 upsert (update or insert) 來簡化邏輯
                await APIKey.upsert({
                    userId: userId,
                    service: service,
                    value: value, // 警告：在生產環境中，應對金鑰進行加密儲存
                });
            })
        );
        
        // 重新從資料庫讀取，確保回傳的是最新狀態
        const updatedApiKeys = await APIKey.findAll({ where: { userId } });
        const keysResponse = updatedApiKeys.reduce((acc, key) => {
            acc[key.service] = key.value; // 同樣，考慮是否要返回金鑰
            return acc;
        }, {});

        res.json({ message: 'API 金鑰已成功更新', keys: keysResponse });

    } catch (error) {
        console.error('保存 API 金鑰時出錯:', error);
        res.status(500).send('伺服器內部錯誤');
    }
});


// @route   GET /api/users/:userId
// @desc    Get user info by ID (for public/admin view)
// @access  Private (建議增加管理員權限驗證)
router.get('/:userId', auth, async (req, res) => {
  // 建議：增加權限檢查，例如只有 admin 可以查詢他人資料
  // if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.userId, 10)) {
  //   return res.status(403).json({ error: 'Forbidden' });
  // }
  
  const { userId } = req.params;
  try {
    const user = await db.User.findByPk(userId, {
      attributes: ['id', 'realName', 'email', 'phone'] // 只返回非敏感資訊
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(`Failed to retrieve user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve user', details: error.message });
  }
});

module.exports = router;
