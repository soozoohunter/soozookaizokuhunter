require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Crawler ok' });
});

// 假設這裡做一些侵權爬蟲邏輯
app.post('/detectInfringement', async (req, res) => {
  const { fingerprint, workId } = req.body;
  if (!fingerprint || !workId) {
    return res.status(400).json({ error: '缺 fingerprint / workId' });
  }

  // 這裡可以呼叫第三方API 或 內部Express API
  // e.g., axios.post('http://suzoo_express:3000/api/infr/report', {...})
  res.json({ message: '已接收爬蟲請求，開始偵測' });
});

app.listen(8081, () => {
  console.log('Crawler服務已啟動，port=8081');
});
