const express = require('express');
const router = express.Router();
const { User, APIKey } = require('../models');
const auth = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'realName', 'email', 'phone'],
      include: [{
        model: APIKey,
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
    const { keys } = req.body;
    const userId = req.user.id;

    if (!keys || typeof keys !== 'object') {
        return res.status(400).json({ error: 'Invalid key format' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Promise.all(
            Object.entries(keys).map(async ([service, value]) => {
                if (typeof value !== 'string') return;
                await APIKey.upsert({
                    userId: userId,
                    service: service,
                    value: value, 
                });
            })
        );
        
        const updatedApiKeys = await APIKey.findAll({ where: { userId } });
        const keysResponse = updatedApiKeys.reduce((acc, key) => {
            acc[key.service] = key.value;
            return acc;
        }, {});

        res.json({ message: 'API keys updated successfully', keys: keysResponse });

    } catch (error) {
        console.error('Error saving API keys:', error);
        res.status(500).send('Server error');
    }
});

// GET /api/users/:userId
router.get('/:userId', auth, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId, {
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
