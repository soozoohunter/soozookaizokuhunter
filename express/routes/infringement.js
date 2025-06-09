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

module.exports = router;
