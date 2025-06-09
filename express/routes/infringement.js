/**
 * express/routes/infringement.js
 * - 侵權掃描 / DMCA 申訴
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { detectInfringement } = require('../services/infringementService');
// const { sendDmcaNotice } = require('../services/dmcaService');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

// --- Mock Data ------------------------------------------------------------
const works = [
  {
    id: 1,
    title: 'Demo Work',
    fingerprint: 'abcd1234',
    fileType: 'image',
    cloudinaryUrl: 'https://placekitten.com/200/200'
  }
];

const infringements = [
  {
    id: 1,
    workId: 1,
    infringingUrl: 'https://evil.com/copy.jpg',
    status: 'pending'
  }
];

function authMiddleware(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s*/, '');
    if (!token) return res.status(401).json({ error:'缺少 Token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch(e){
    return res.status(401).json({ error:'Token 無效' });
  }
}

// POST /infringement/scan
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { filePath, imageUrl } = req.body || {};
    if (!filePath && !imageUrl) {
      return res.status(400).json({ error: '請提供 imageUrl 或 filePath' });
    }

    let localFile = filePath;
    let cleanup = false;

    if (!localFile && imageUrl) {
      try {
        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const tmpName = `scan_${Date.now()}${ext}`;
        localFile = path.join(__dirname, '../../uploads/tmp', tmpName);
        const resp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(localFile, resp.data);
        cleanup = true;
      } catch (err) {
        console.error('[download image fail]', err);
        return res.status(400).json({ error: '無法下載 imageUrl' });
      }
    } else if (localFile && !fs.existsSync(localFile)) {
      return res.status(400).json({ error: 'filePath 無效' });
    }

    const result = await detectInfringement(localFile, imageUrl || '');

    if (cleanup) {
      fs.unlink(localFile, () => {});
    }

    return res.json(result);
  } catch (e) {
    console.error('[Infringement Scan Error]', e);
    return res.status(500).json({ error: e.message });
  }
});

// POST /infringement/dmca
router.post('/dmca', authMiddleware, async (req, res) => {
  try {
    const { targetUrls } = req.body;
    if (!Array.isArray(targetUrls) || !targetUrls.length) {
      return res.status(400).json({ error:'請提供 targetUrls (Array)' });
    }
    // const result = await sendDmcaNotice(targetUrls);
    const result = { success:true, detail:'Mock DMCA notice sent' };
    return res.json(result);
  } catch(e){
    console.error('[DMCA Error]', e);
    return res.status(500).json({ error:e.message });
  }
});

// GET /infringements => list user's works & infringement records
router.get('/infringements', authMiddleware, async (req, res) => {
  return res.json({ works, infringements });
});

// POST /infringement/legalize
router.post('/infringement/legalize', authMiddleware, async (req, res) => {
  const { infId } = req.body;
  const target = infringements.find(i => i.id === Number(infId));
  if (!target) return res.status(404).json({ error: 'NOT_FOUND' });
  target.status = 'legalized';
  return res.json({ message: 'legalized' });
});

// POST /infringement/requestLicensingFee
router.post('/infringement/requestLicensingFee', authMiddleware, async (req, res) => {
  const { infId } = req.body;
  const target = infringements.find(i => i.id === Number(infId));
  if (!target) return res.status(404).json({ error: 'NOT_FOUND' });
  target.status = 'licensingFeeRequested';
  return res.json({ message: 'licensing fee requested' });
});

// POST /infringement/lawsuit
router.post('/infringement/lawsuit', authMiddleware, async (req, res) => {
  const { infId } = req.body;
  const target = infringements.find(i => i.id === Number(infId));
  if (!target) return res.status(404).json({ error: 'NOT_FOUND' });
  target.status = 'lawsuit';
  return res.json({ message: 'lawsuit initiated' });
});

// POST /dmca/report => alias of /infringement/dmca
router.post('/dmca/report', authMiddleware, async (req, res) => {
  const { targetUrls } = req.body;
  if (!Array.isArray(targetUrls) || !targetUrls.length) {
    return res.status(400).json({ error: '請提供 targetUrls (Array)' });
  }
  const result = { success: true, detail: 'Mock DMCA notice sent' };
  return res.json(result);
});

module.exports = router;
