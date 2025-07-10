// express/services/dmcaService.js (最終修正版，使用 JSON 格式發送請求)
const axios = require('axios');
const logger = require('../utils/logger');

const DMCA_EMAIL = process.env.DMCA_API_EMAIL;
const DMCA_PASSWORD = process.env.DMCA_API_PASSWORD;
const DMCA_API_URL = process.env.DMCA_API_URL || 'https://api.dmca.com';

const isDmcaEnabled = DMCA_EMAIL && DMCA_PASSWORD;

let apiToken = { token: null, expiresAt: 0 };

if (isDmcaEnabled) {
  logger.info('[DMCA Service] Service is ENABLED.');
} else {
  logger.warn('[DMCA Service] Service is DISABLED due to missing credentials.');
}

async function getApiToken() {
  const now = Date.now();
  if (apiToken.token && now < apiToken.expiresAt) {
    logger.info('[DMCA Service] Using cached API token.');
    return apiToken.token;
  }

  logger.info('[DMCA Service] Requesting new API token...');
  const loginUrl = `${DMCA_API_URL}/login`;
  
  // [修正] DMCA API 的登入需要 JSON 格式
  const loginData = {
    email: DMCA_EMAIL,
    password: DMCA_PASSWORD,
  };

  try {
    const response = await axios.post(loginUrl, loginData, {
        headers: { 'Content-Type': 'application/json' }
    });
    
    const receivedToken = response.data?.Token || response.data?.token;

    if (receivedToken) {
      apiToken = {
        token: receivedToken,
        expiresAt: Date.now() + 50 * 60 * 1000, // 緩存 50 分鐘
      };
      logger.info('[DMCA Service] Successfully logged in and cached new API token.');
      return apiToken.token;
    }
    logger.error(`[DMCA Service] Login failed. Response:`, response.data);
    throw new Error(response.data?.message || 'Login failed, no token returned.');
  } catch (error) {
    logger.error(`[DMCA Service] Exception during login:`, { 
        message: error.message,
        responseData: error.response?.data 
    });
    apiToken = { token: null, expiresAt: 0 };
    throw new Error(`Failed to log in to DMCA API: ${error.message}`);
  }
}

async function sendTakedownRequest(takedownDetails) {
  if (!isDmcaEnabled) {
    return { success: false, message: 'DMCA Takedown request failed: Service is not configured.', data: null };
  }

  const { infringingUrl, originalUrl, description } = takedownDetails;

  if (!infringingUrl || !originalUrl) {
    throw new Error('Infringing URL and Original URL are required.');
  }

  try {
    const token = await getApiToken();
    const createCaseUrl = `${DMCA_API_URL}/createCase`;

    // [修正] 將請求資料改為 JSON 物件
    const caseData = {
        Token: token,
        'Infringing URL': infringingUrl,
        'Copied From URL': originalUrl,
        Description: description || `Automated takedown for copyrighted work. Original located at ${originalUrl}`,
    };

    logger.info(`[DMCA Service] Creating takedown case for: ${infringingUrl}`);
    const response = await axios.post(createCaseUrl, caseData, {
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 200 && response.data?.caseID) {
        logger.info(`[DMCA Service] Takedown case creation successful. Case ID: ${response.data.caseID}`);
        return { success: true, message: response.data.message || 'Case created successfully.', data: response.data };
    }
    
    logger.error(`[DMCA Service] Takedown case creation failed`, response.data);
    return { success: false, message: response.data?.message || `DMCA API returned status ${response.status}`, data: response.data };

  } catch (error) {
    const status = error.response?.status;
    const rawData = error.response?.data;
    logger.error(`[DMCA Service] An exception occurred during createTakedownCase (Status: ${status})`, {
        message: error.message,
        responseData: rawData
    });
    return { success: false, message: `An exception occurred: ${error.message}`, data: rawData };
  }
}

module.exports = {
  sendTakedownRequest,
  isDmcaEnabled,
};
