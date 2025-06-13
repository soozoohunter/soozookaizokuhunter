/*************************************************************
 * express/routes/searchRoutes.js
 *
 * - POST /api/search/tineye
 *************************************************************/
const express = require('express');
const router = express.Router();
const tineyeService = require('../services/tineyeService');
const { searchVisionByBuffer } = require('../services/visionService');
const upload = require('../middleware/upload');

// POST /api/search/tineye
// Body: { imageUrl: "..." }
router.post('/search/tineye', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file required' });
    }

    const buffer = req.file.buffer;
    const matches = await tineyeService.searchByBuffer(buffer);
    return res.json({ matches });
  } catch (err) {
    console.error('[POST /api/search/tineye] error =>', err.message || err);
    return res.status(500).json({ error: err.message || 'TinEye search failed' });
  }
});

// POST /api/search/vision
router.post('/search/vision', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file required' });
    }
    const buffer = req.file.buffer;
    const links = await searchVisionByBuffer(buffer);
    return res.json({ matches: links });
  } catch (err) {
    console.error('[POST /api/search/vision] error =>', err.message || err);
    return res.status(500).json({ error: err.message || 'Vision search failed' });
  }
});

module.exports = router;
