const express = require('express');
const router = express.Router();

const { searchTinEyeApi } = require('../services/tineyeService');

// POST /api/search/tineye
router.post('/search/tineye', async (req, res) => {
  const { imageUrl } = req.body || {};
  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl required' });
  }
  try {
    const matches = await searchTinEyeApi(imageUrl);
    return res.json({ matches });
  } catch (err) {
    console.error('[POST /api/search/tineye] error =>', err.message || err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
