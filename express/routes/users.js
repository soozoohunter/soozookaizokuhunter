const express = require('express');
const router = express.Router();
// [★★ 關鍵修正 ★★] 導入整個 db 物件
const db = require('../models');
const auth = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await db.User.findByPk(userId, {
      attributes: ['id', 'realName', 'email', 'phone'],
      include: [{
        model: db.APIKey,
        as: 'apiKeys',
        attributes: ['service']
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

// POST /api/users/api-keys
router.post('/api-keys', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: '只有管理員可以執行此操作' });
    }
    const { keys } = req.body;
    const userId = req.user.id;

    if (!keys || typeof keys !== 'object') {
        return res.status(400).json({ error: '無效的金鑰格式' });
    }

    try {
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: '找不到用戶' });
        }

        await Promise.all(
            Object.entries(keys).map(async ([service, value]) => {
                if (typeof value !== 'string') return;
                await db.APIKey.upsert({
                    userId: userId,
                    service: service,
                    value: value,
                });
            })
        );
        
        const updatedApiKeys = await db.APIKey.findAll({ where: { userId } });
        const keysResponse = updatedApiKeys.reduce((acc, key) => {
            acc[key.service] = key.value;
            return acc;
        }, {});

        res.json({ message: 'API 金鑰已成功更新', keys: keysResponse });

    } catch (error) {
        console.error('保存 API 金鑰時出錯:', error);
        res.status(500).send('伺服器內部錯誤');
    }
});

// GET /api/users/:userId
router.get('/:userId', auth, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await db.User.findByPk(userId, {
      attributes: ['id', 'realName', 'email', 'phone']
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
