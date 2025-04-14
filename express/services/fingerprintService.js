// services/fingerprintService.js
const axios = require('axios');
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://suzoo_fastapi:8000';

async function checkImage(fileBuffer) {
  if (!FASTAPI_URL) {
    throw new Error('FastAPI 服務 URL 未設定');
  }
  try {
    // 發送檔案 Buffer 至 FastAPI。使用 FormData 將 buffer 作為檔案字段傳遞
    const res = await axios.post(`${FASTAPI_URL}/fingerprint`, fileBuffer, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
    // 假設 FastAPI 返回類似 { fingerprint: "...", duplicate: bool, matchId: "...?" }
    return res.data;
  } catch (err) {
    console.error('指紋服務請求失敗:', err.response ? err.response.data : err.message);
    throw new Error('指紋比對服務無法使用');
  }
}

module.exports = { checkImage };
