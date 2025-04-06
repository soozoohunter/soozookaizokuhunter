require('dotenv').config();
const axios = require('axios');

const {
  RAPIDAPI_KEY,
  EXPRESS_LOGIN_USER,
  EXPRESS_LOGIN_PASS
} = process.env;

/**
 * 範例流程：
 * 1) 先登入 Express 後台 (用系統預設爬蟲帳號)
 * 2) 拿到 token
 * 3) 向 RapidAPI 取得可能侵權清單
 * 4) 若發現可疑 -> 報告給 Express /api/infr/foundInfringement
 */
async function mainCrawler() {
  try {
    // STEP 1: 取得 Token (假設您的 Express 提供 /api/auth/login)
    const loginResp = await axios.post('http://express:3000/api/auth/login', {
      username: EXPRESS_LOGIN_USER,  // 預設爬蟲帳號(可放 env)
      password: EXPRESS_LOGIN_PASS
    });
    const token = loginResp.data.token;
    console.log('[Crawler] 已取得後端 token:', token);

    // STEP 2: 向 RapidAPI 取得疑似侵權
    const resp = await axios.get('https://example-rapidapi.com/infringements', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    const results = resp.data; 
    console.log('[Crawler] 取得外部API結果:', results);

    // 假設 results 為陣列：每個包含 {workId, infringingUrl, ...}
    // STEP 3: 遍歷結果
    for(const item of results){
      // 例如:
      // item = { workId: 123, infringingUrl: 'https://xxx' ...}
      if(item.workId && item.infringingUrl){
        console.log(`[Crawler] 發現可疑 => workId=${item.workId}, url=${item.infringingUrl}`);

        // STEP 4: 回報給 Express => /api/infr/foundInfringement
        try{
          let reportResp = await axios.post(
            'http://express:3000/api/infr/foundInfringement',
            {
              workId: item.workId,
              infringingUrl: item.infringingUrl,
              status: 'detected' 
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('[Crawler] 回報成功:', reportResp.data.message);
        }catch(e){
          console.error('[Crawler] 回報失敗:', e.response?.data || e.message);
        }
      }
    }

    console.log('[Crawler] 全部可疑檢測流程完畢');
  } catch (err) {
    console.error('[Crawler] 發生錯誤:', err.message);
  }
}

// 亦可做「週期呼叫 mainCrawler」(ex. setInterval / cron job)
mainCrawler();
