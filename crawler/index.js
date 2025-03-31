const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// 健康檢查
app.get('/health',(req,res)=>{
  res.json({status:'Crawler v9 healthy'});
});

app.post('/detect', async(req,res)=>{
  const { url, fingerprint } = req.body;
  if(!url || !fingerprint) {
    return res.status(400).json({error:'缺少 url 或 fingerprint'});
  }
  try {
    const browser = await puppeteer.launch({
      headless:true,
      args:['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url,{waitUntil:'networkidle2'});
    // ...做進階比對...
    await browser.close();

    // 若發現侵權 => 可呼叫 /dmca/report
    // e.g. await axios.post("http://express:3000/dmca/report",{infringingUrl:url,workId:123});

    res.json({message:'偵測完成(示範)', url, fingerprint});
  } catch(e) {
    console.error('crawler detect error:', e.message);
    res.status(500).json({error:e.toString()});
  }
});

app.listen(8081,()=>{
  console.log('Crawler v9 on port 8081');
});
