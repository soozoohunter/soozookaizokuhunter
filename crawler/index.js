require('dotenv').config();
const axios = require('axios');

/**
 * 偵測侵權行為的爬蟲示例
 * - 可擴充：若發現可疑內容，呼叫 /api/infr/report 來新增侵權紀錄 (並觸發鏈上寫入)
 */
async function detectInfringement() {
  try {
    const response = await axios.get('https://example-rapidapi.com/infringements', {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY
      }
    });
    console.log('爬蟲抓取結果:', response.data);

    // 假設檢測到某用戶Email與侵權描述, 直接呼叫 /api/infr/report
    // const token = '...'; // 需先從 /api/auth/login 取得
    // await axios.post('http://express:3000/api/infr/report', {
    //   workId: 123,
    //   description: "侵權內容描述"
    // }, {
    //   headers: { Authorization: `Bearer ${token}` }
    // });

  } catch (err) {
    console.error('爬蟲錯誤:', err.message);
  }
}

detectInfringement();
