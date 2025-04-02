const express = require('express');
const router = express.Router();
const Infringement = require('../models/Infringement');

// 新增侵權記錄
router.post('/report', async (req, res) => {
  const { workId, description } = req.body;
  try {
    const infringement = await Infringement.create({ workId, description });
    res.json({ message: '侵權記錄已新增', infringement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 獲取所有侵權記錄
router.get('/', async (req, res) => {
  try {
    const infringements = await Infringement.findAll();
    res.json(infringements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
