const axios = require('axios');

const DMCA_API_URL = process.env.DMCA_API_URL || 'https://api.dmca.com';
const DMCA_API_EMAIL = process.env.DMCA_API_EMAIL;
const DMCA_API_PASSWORD = process.env.DMCA_API_PASSWORD;

if (!DMCA_API_EMAIL || !DMCA_API_PASSWORD) {
  throw new Error('DMCA_API_EMAIL and DMCA_API_PASSWORD must be set');
}

/**
 * Send DMCA takedown notice via DMCA.com API
 * @param {string[]} targetUrls - infringing URLs
 * @returns {Promise<{success: boolean, dmcaCaseId?: string, error?: string}>}
 */
async function sendDmcaNotice(targetUrls) {
  try {
    const loginRes = await axios.post(`${DMCA_API_URL}/login`, {
      email: DMCA_API_EMAIL,
      password: DMCA_API_PASSWORD,
    }, { timeout: 15000 });
    const token = loginRes.data?.token;
    if (!token) throw new Error('Login failed: missing token');

    const res = await axios.post(
      `${DMCA_API_URL}/takedowns`,
      { links: targetUrls },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );
    const dmcaCaseId = res.data?.caseId || res.data?.id;
    if (!dmcaCaseId) throw new Error('DMCA API response missing caseId');
    return { success: true, dmcaCaseId };
  } catch (err) {
    const status = err.response?.status || 'N/A';
    const message = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    const errorMsg = `DMCA API request failed with status ${status}. ${message}`;
    console.error('[dmcaService] error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

module.exports = { sendDmcaNotice };
