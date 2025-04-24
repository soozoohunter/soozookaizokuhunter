// express/services/fingerprintService.js
const crypto = require('crypto');
const axios = require('axios');

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// 如需透過 FastAPI 做更多檢查
async function checkImageViaFastAPI(buffer) {
  const fastapiUrl = process.env.FASTAPI_URL || 'http://suzoo_fastapi:8000';
  const resp = await axios.post(`${fastapiUrl}/fingerprint`, buffer, {
    headers: { 'Content-Type': 'application/octet-stream' }
  });
  return resp.data;
}

module.exports = {
  sha256,
  checkImageViaFastAPI
};
