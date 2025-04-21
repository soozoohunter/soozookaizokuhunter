/**
 * express/routes/infringement.js
 * - 侵權掃描 / DMCA 申訴
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
// const { detectInfringement } = require('../services/crawlerService');
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
    // const results = await detectInfringement(req.body.fingerprint);
    const results = [
      'https://fake.com/infringed1.jpg',
      'https://fake.com/infringed2.jpg'
    ];
    return res.json({ message:'偵測完成', matches:results });
  } catch(e) {
    console.error('[Infringement Scan Error]', e);
    return res.status(500).json({ error:e.message });
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
