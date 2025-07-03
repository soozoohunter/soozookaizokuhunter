const express = require('express');
const router = express.Router();
const db = require('../models');
const { sendTakedownRequest, isDmcaEnabled } = require('../services/dmcaService');
const checkQuota = require('../middleware/quotaCheck');
const { UsageRecord, DMCARequest, InfringementReport } = db;

router.post('/', checkQuota('dmca_takedown'), async (req, res) => {
  if (!isDmcaEnabled) {
    return res.status(503).json({ error: 'DMCA Service is not configured on the server.' });
  }
  const { scanId, infringingUrl } = req.body;
  if (!scanId || !infringingUrl) {
    return res.status(400).json({ error: 'Missing scanId or infringingUrl' });
  }
  try {
    const scan = await db.Scan.findByPk(scanId, { include: { model: db.File, as: 'file' } });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const originalUrl = `${process.env.PUBLIC_HOST}/api/protect/view/${scan.file_id}`;
    const takedownDetails = { infringingUrl, originalUrl };
    const dmcaResult = await sendTakedownRequest(takedownDetails);

    const report = await InfringementReport.create({
      user_id: req.user.userId || req.user.id,
      scan_id: scanId,
      links_confirmed: [infringingUrl]
    });

    await DMCARequest.create({
      user_id: req.user.userId || req.user.id,
      scan_id: scanId,
      report_id: report.id,
      infringing_url: infringingUrl,
      status: dmcaResult.success ? 'submitted' : 'failed',
      dmca_case_id: dmcaResult.data?.caseID || null,
      submitted_at: new Date()
    });
    await UsageRecord.create({ user_id: req.user.userId || req.user.id, feature_code: 'dmca_takedown' });

    if (dmcaResult.success) {
      res.json({ success: true, requestId: report.id });
    } else {
      res.status(400).json({ error: dmcaResult.message });
    }
  } catch (err) {
    console.error('[DMCA]', err);
    res.status(500).json({ error: 'Failed to submit DMCA request.' });
  }
});

module.exports = router;
