require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const puppeteer = require('puppeteer');

const { RAPIDAPI_KEY } = process.env;

const app = express();
app.use(bodyParser.json());

app.get('/health',(req,res)=>{
  res.json({status:'Crawler VSS healthy'});
});

/**
 * detectInfringement
 * body: { fingerprint, workId, role }
 */
app.post('/detectInfringement', async(req,res)=>{
  const { fingerprint, workId, role } = req.body;
  if(!fingerprint || !workId){
    return res.status(400).json({ error:'缺 fingerprint/workId' });
  }
  console.log(`crawler: role=${role}, fingerprint=${fingerprint.slice(0,8)}`);

  // 先詢問 express: "該 workId 的作者是誰？該作者有哪些 platformAccounts？"
  let excludedList = [];
  try{
    // 1) 先查出 work -> userId
    let wRes = await axios.get(`http://express:3000/api/infr/workUser/${workId}`);
    if(wRes.data && wRes.data.userId){
      let userId = wRes.data.userId;
      // 2) 再呼叫 /api/profile/myPlatforms with a special internal token
      let pRes = await axios.get('http://express:3000/api/profile/myPlatforms', {
        headers:{ 'Authorization':'Bearer InternalCrawlerToken', 'X-USERID': userId }
      });
      excludedList = pRes.data || [];
    }
  } catch(e){
    console.error('無法取得用戶平台帳號:', e.message);
  }

  // 針對 role 不同 → 偵測的平台清單
  let platforms = (role==='shortVideo')
    ? ['youtube','tiktok','instagram','facebook']
    : ['shopee','ruten','ebay','amazon'];

  let foundList = [];
  for(let pf of platforms){
    let r = await detectPlatform(pf, fingerprint, excludedList);
    if(r){
      foundList.push({ platform:pf, url:r });
      // 改用 foundInfringement (status:'detected')
      try{
        await axios.post('http://express:3000/api/infr/foundInfringement',{
          workId,
          infringingUrl: r,
          status: 'detected'
        });
      }catch(e){
        console.error('foundInfringement err:', e.message);
      }
    }
  }

  res.json({ message:'偵測完成(待確認)', foundInfringements:foundList });
});

// detectPlatform
async function detectPlatform(platform, fingerprint, excludedList){
  let key8 = fingerprint.slice(0,8);

  switch(platform){
    case 'youtube':   return await detectYouTube(key8, excludedList);
    case 'tiktok':    return await detectTikTok(key8, excludedList);
    case 'instagram': return await detectIG(key8, excludedList);
    case 'facebook':  return await detectFB(key8, excludedList);
    case 'shopee':    return await detectShopee(key8, excludedList);
    case 'ruten':     return await detectRuten(key8, excludedList);
    case 'ebay':      return await detectEbay(key8, excludedList);
    case 'amazon':    return await detectAmazon(key8, excludedList);
    default: return null;
  }
}

async function detectYouTube(keyword, excludedList){
  try{
    let resp = await axios.get('https://website-social-scraper.p.rapidapi.com/v1/youtube-search',{
      params:{ q: keyword },
      headers:{ 'X-RapidAPI-Key': RAPIDAPI_KEY }
    });
    let arr = resp.data.results || [];
    let match = arr.find(x=> x.matchConfidence >= 95);

    if(!match) return null;
    // 若 match.channelId 在 excludedList
    // 例如 excludedList = [{platform:'youtube',accountId:'myChannel123'}...]
    let channelId = match.channelId || '';
    if(excludedList.some(acc=> acc.platform==='youtube' && acc.accountId===channelId)){
      console.log('跳過合法帳號 channelId=', channelId);
      return null;
    }
    return `https://www.youtube.com/watch?v=${match.videoId}`;
  }catch(e){
    console.error('youtube fail:', e.message);
  }
  return null;
}

// 其餘 detectTikTok, detectIG... 略同
async function detectTikTok(keyword,excludedList){ return null; }
async function detectIG(keyword,excludedList){ return null; }
async function detectFB(keyword,excludedList){ return null; }
async function detectShopee(keyword,excludedList){ return null; }

async function detectRuten(keyword,excludedList){
  try{
    const browser = await puppeteer.launch({headless:true,args:['--no-sandbox','--disable-setuid-sandbox']});
    const page = await browser.newPage();
    let url = `https://find.ruten.com.tw/s/?q=${keyword}`;
    await page.goto(url,{waitUntil:'networkidle2'});
    let content = await page.content();
    await browser.close();

    // if content includes '仿冒' or '未授權'
    if(content.includes('仿冒') || content.includes('未授權')){
      // 如果 excludedList.some(...) => skip
      // 這裡示範跳過
      return url;
    }
  }catch(e){
    console.error('ruten fail:', e.message);
  }
  return null;
}

async function detectEbay(keyword,excludedList){ return null; }
async function detectAmazon(keyword,excludedList){ return null; }

app.listen(8081,()=>{
  console.log('Crawler VSS on 8081');
});
