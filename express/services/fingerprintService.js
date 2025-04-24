/********************************************************************
 * services/fingerprintService.js
 * 保留：sha256 + checkImageViaFastAPI
 ********************************************************************/
const crypto = require('crypto');
const axios = require('axios');

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function checkImageViaFastAPI(buffer) {
  const fastapiUrl = process.env.FASTAPI_URL || 'http://suzoo_fastapi:8000';
  // Demo：用 /fingerprint 接口
  const resp = await axios.post(`${fastapiUrl}/fingerprint`, buffer, {
    headers: { 'Content-Type': 'application/octet-stream' }
  });
  return resp.data; // e.g. { fingerprint, duplicate }
}

module.exports = {
  sha256,
  checkImageViaFastAPI
};
