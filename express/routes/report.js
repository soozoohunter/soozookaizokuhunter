const express = require('express');
const router = express.Router();
const path = require('path');
const { generateSearchReport } = require('../services/pdf/pdfService');

/**
 * POST /api/report/search
 * 接收各搜尋引擎結果 (連結、截圖等)，生成 PDF 報告
 * body: { results: Array<{engine, screenshotPath, links:[]} > }
 */
router.post('/report/search', async (req, res) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results) || !results.length) {
      return res.status(400).json({ error: 'Invalid results payload' });
    }

    const pdfPath = await generateSearchReport(results);
    const pdfUrl = `/uploads/${path.basename(pdfPath)}`;

    return res.json({ report: pdfUrl, path: pdfPath });
  } catch (err) {
    console.error('[POST /report/search] Error:', err);
    return res.status(500).json({ error: 'Failed to generate search report' });
  }
});

module.exports = router;
