// express/routes/report.js
const express = require('express');
const path    = require('path');
const router  = express.Router();
const { generateSearchReport } = require('../services/pdf/pdfService');

/**
 * POST /api/report/search
 * 接收各搜尋引擎結果 (連結、截圖等)，生成 PDF 報告
 * body: { results: Array<{ engine: string, screenshotPath: string, links: string[] }> }
 */
router.post('/report/search', async (req, res) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Invalid results payload' });
    }

    // 生成 PDF 報告，並保存到 uploads 目錄
    const pdfPath = await generateSearchReport(results);
    const pdfUrl  = `/uploads/${path.basename(pdfPath)}`;

    return res.json({ path: pdfPath, url: pdfUrl });
  } catch (err) {
    console.error('[POST /api/report/search] Error:', err);
    return res.status(500).json({ error: 'Failed to generate search report' });
  }
});

module.exports = router;
