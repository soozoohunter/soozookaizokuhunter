const express = require('express');
const router = express.Router();
const db = require('../models');
const auth = require('../middleware/auth');

// GET /api/users/profile - get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: ['id', 'realName', 'email', 'phone'],
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Failed to retrieve user profile:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// GET /api/users/:userId - 根據 ID 獲取使用者資訊 (姓名, Email等)
router.get('/:userId', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

module.exports = router;
