const express = require('express');
const router = express.Router();
const db = require('../models');

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
