/*************************************************************
 * express/routes/searchRoutes.js
 *
 * - /api/search/tineye
 *************************************************************/
const express = require('express');
const router = express.Router();
const { searchTinEyeApi } = require('../services/tineyeService');

// POST /api/search/tineye { imageUrl: "..." }
router.post('/search/tineye', async (req, res) => {
  const { imageUrl } = req.body || {};
  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl required' });
  }

  try {
    const matches = await searchTinEyeApi(imageUrl);
    res.json({ matches });
  } catch (err) {
    console.error('[searchTinEyeApi]', err.message);
    res.status(500).json({ error: 'TinEye search failed' });
  }
});

module.exports = router;
