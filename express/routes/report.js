const express = require('express');
const path = require('path');
const router = express.Router();

// service for generating PDF report
const { generateSearchReport } = require('../services/pdf/pdfService');

/**
 * POST /api/report/search
 * Accepts search result data and returns generated PDF path/URL.
 */
router.post('/report/search', async (req, res) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results)) {
      return res.status(400).json({ error: 'Invalid results' });
    }

    // generate PDF using provided search results
    const pdfPath = await generateSearchReport(results);
    const url = `/uploads/${path.basename(pdfPath)}`;

    return res.json({ path: pdfPath, url });
  } catch (err) {
    console.error('[report/search error]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
