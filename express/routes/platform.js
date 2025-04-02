const express = require('express');
const router = express.Router();

// 可加上 authMiddleware
router.get('/', (req, res) => {
  res.json({ message: '平台帳號 API' });
});

module.exports = router;
