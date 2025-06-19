require('dotenv').config();
const axios = require('axios');

const { RAPIDAPI_KEY, EXPRESS_LOGIN_USER, EXPRESS_LOGIN_PASS } = process.env;

// 捕獲未處理的例外與拒絕，避免進程退出
process.on('uncaughtException', (err) => {
  console.error('[Crawler] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Crawler] Unhandled Rejection:', reason);
});

// 重試機制：嘗試多次登入 Express 取得 token
async function loginExpress(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      // 將原本 "http://express:3000" 改為 "http://suzoo_express:3000"
      const response = await axios.post('http://suzoo_express:3000/api/auth/login', {
        username: EXPRESS_LOGIN_USER,
        password: EXPRESS_LOGIN_PASS
      });
      return response.data.token;
    } catch (error) {
      console.error(`[Crawler] Login failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Failed to login to Express after multiple attempts.');
}

async function mainCrawler() {
  try {
    const token = await loginExpress();
    console.log('[Crawler] 已取得後端 token:', token);
    
    // 呼叫 RapidAPI 的 TikTok API
    const resp = await axios.get(
      'https://tiktok-scraper7.p.rapidapi.com/featured/list/entertainment',
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
        },
        params: { cursor: '0' }
      }
    );
    const results = resp.data;
    console.log('[Crawler] 取得外部API結果:', results);
    
    // 遍歷檢測結果並回報給 suzoo_express
    for (const item of results) {
      if (item.workId && item.infringingUrl) {
        console.log(`[Crawler] 發現可疑 => workId=${item.workId}, url=${item.infringingUrl}`);
        try {
          // 同理, 這裡也要 "http://suzoo_express:3000"
          const reportResp = await axios.post(
            'http://suzoo_express:3000/api/infr/foundInfringement',
            { workId: item.workId, infringingUrl: item.infringingUrl, status: 'detected' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('[Crawler] 回報成功:', reportResp.data.message);
        } catch (e) {
          console.error('[Crawler] 回報失敗:', e.response?.data || e.message);
        }
      }
    }
    console.log('[Crawler] 本次檢測流程完畢');
  } catch (err) {
    console.error('[Crawler] 發生錯誤:', err.message);
  }
}

// 以 setInterval 讓爬蟲每 60 秒重複執行檢測，保持進程不退出
function startCrawler() {
  mainCrawler().finally(() => {
    console.log('[Crawler] 等待 60 秒後重新啟動檢測流程...');
    setTimeout(startCrawler, 60000);
  });
}

startCrawler();
