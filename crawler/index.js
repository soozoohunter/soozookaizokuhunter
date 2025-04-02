require('dotenv').config();
const axios = require('axios');

async function detectInfringement() {
  try {
    const response = await axios.get('https://example-rapidapi.com/infringements', {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY
      }
    });
    console.log('爬蟲抓取結果:', response.data);
  } catch (err) {
    console.error('爬蟲錯誤:', err.message);
  }
}

detectInfringement();
