/**
 * express/routes/infringement.js
 * - 侵權掃描 / DMCA 申訴
 */
// Load environment variables from .env at startup. The key values used here are
// TINEYE_API_KEY (TinEye REST API key) and GOOGLE_APPLICATION_CREDENTIALS for
// Google Vision. Any missing required config will cause the service to exit.
require('dotenv').config();

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const visionService = require('../services/visionService');
const upload = require('../middleware/upload');

//
// 兼容兩邊的環境變數設定：
// ENGINE_MAX_LINKS: TinEye 搜尋結果截取
// VISION_MAX_RESULTS: Google Vision 搜尋結果截取
//
const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS, 10) || 50;

// const { sendDmcaNotice } = require('../services/dmcaService');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';
const TINEYE_API_KEY = process.env.TINEYE_API_KEY;
const VISION_CRED_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/credentials/gcp-vision.json';

if (!TINEYE_API_KEY) {
  // Fail fast when the service starts if TinEye API key is missing
  throw new Error('Startup failed: TINEYE_API_KEY is not defined');
}

function ensureVisionCredentials(req, res, next) {
  try {
    if (!fs.existsSync(VISION_CRED_PATH)) {
      throw new Error('credential file missing');
    }
    const raw = fs.readFileSync(VISION_CRED_PATH, 'utf-8');
    JSON.parse(raw); // will throw if invalid
    // set for vision client to pick up
    process.env.GOOGLE_APPLICATION_CREDENTIALS = VISION_CRED_PATH;
    next();
  } catch (err) {
    console.error('[Vision Credential Error]', err);
    return res.status(500).json({ success: false, message: 'Vision credential invalid' });
  }
}

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
    if (!token) return res.status(401).json({ error: '缺少 Token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token 無效' });
  }
}

// POST /infringement/scan
router.post('/scan', upload.single('file'), authMiddleware, ensureVisionCredentials, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'file required' });
    const { originalname, size } = req.file;
    console.log(`[scan] user=${req.user?.id || 'anon'} file=${originalname} size=${size}`);
    const start = Date.now();
    const buffer = req.file.buffer;
    const report = await visionService.infringementScan({ buffer });
    console.log(`[scan] completed in ${Date.now() - start}ms tinEyeLinks=${report.tineye.links.length} visionLinks=${report.vision.links.length}`);
    return res.json(report);
  } catch (e) {
    console.error('[Infringement Scan Error]', e);
    return res.status(500).json({ message: e.message });
  }
});

// POST /infringement/dmca
router.post('/dmca', authMiddleware, async (req, res) => {
  try {
    const { targetUrls } = req.body;
    if (!Array.isArray(targetUrls) || !targetUrls.length) {
      return res.status(400).json({ error: '請提供 targetUrls (Array)' });
    }
    // const result = await sendDmcaNotice(targetUrls);
    const result = { success: true, detail: 'Mock DMCA notice sent' };
    return res.json(result);
  } catch (e) {
    console.error('[DMCA Error]', e);
    return res.status(500).json({ error: e.message });
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
