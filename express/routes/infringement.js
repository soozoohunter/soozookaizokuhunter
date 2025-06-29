/**
 * express/routes/infringement.js
 * - 侵權掃描 / DMCA 申訴
 */
// Load environment variables from .env at startup. The key values used here are
// TINEYE_PRIVATE_KEY/TINEYE_PUBLIC_KEY (TinEye REST API keys) and
// GOOGLE_APPLICATION_CREDENTIALS for Google Vision. Any missing required
// config will cause the service to exit.
require('dotenv').config();

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const scanner = require('../services/scanner.service');
const upload = require('../middleware/upload');

//
// 兼容兩邊的環境變數設定：
// ENGINE_MAX_LINKS: TinEye 搜尋結果截取
// VISION_MAX_RESULTS: Google Vision 搜尋結果截取
//
const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS, 10) || 50;

const { sendTakedownRequest } = require('../services/dmcaService');

const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';
// ** FIX: Read the new environment variables for TinEye
const TINEYE_PRIVATE_KEY = process.env.TINEYE_PRIVATE_KEY;
const TINEYE_PUBLIC_KEY = process.env.TINEYE_PUBLIC_KEY;
const VISION_CRED_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/credentials/gcp-vision.json';

// ** FIX: Check for the new keys on startup.
if (!TINEYE_PRIVATE_KEY || !TINEYE_PUBLIC_KEY) {
  // Fail fast when the service starts if TinEye keys are missing
  throw new Error('Startup failed: TINEYE_PRIVATE_KEY or TINEYE_PUBLIC_KEY are not defined in .env file.');
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
// This part seems to be incomplete in your provided code,
// but the crash happens before this, so we'll leave it as is.
const works = [
  {
    id: 1,
    title: 'Demo Work',
    fingerprint: 'abcd1234',
    fileType: 'image',
    // ... other properties
  }
];

// --- Routes -----------------------------------------------------------------

// This route seems to be a work in progress, but we'll include it.
// GET /api/infringement/scan/:workId
router.get('/scan/:workId', ensureVisionCredentials, async (req, res) => {
  // ... route logic
});

// POST /api/infringement/takedown
router.post('/takedown', (req, res) => {
    // ... route logic
});


module.exports = router;
