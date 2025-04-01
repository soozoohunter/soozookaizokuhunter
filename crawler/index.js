require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const puppeteer = require('puppeteer');

const { RAPIDAPI_KEY } = process.env;

const app = express();
app.use(bodyParser.json());

app.get('/health',(req,res)=>{
  res.json({status:'Crawler VVS healthy'});
});

/**
 * detectInfringement
 * body: { fingerprint, workId, role }
 */
app.post('/detectInfringement', async(req,res)=>{
  const { fingerprint, workId, role } = req.body;
  if(!fingerprint||!workId) return res.status(400).json({error:'缺 fingerprint/workId'});
  console.log(`crawler: role=${role}, fingerprint=${fingerprint.slice(0,8)}`);

  let platforms=(role==='shortVideo')
    ? ['youtube','tiktok','instagram','facebook']
    : ['shopee','ruten','ebay','amazon'];

  let foundList=[];
  for(let pf of platforms){
    let r=await detectPlatform(pf,fingerprint);
    if(r){
      foundList.push({platform:pf, url:r});
      // call /api/infr/dmca => express
      try{
        await axios.post('http://express:3000/api/infr/dmca',{
          workId,
          infringingUrl:r
        },{
          headers:{'Authorization':'Bearer CrawlerInternal'}
        });
      }catch(e){
        console.error('DMCA err:', e.message);
      }
    }
  }

  res.json({message:'偵測完成', foundInfringements:foundList});
});

async function detectPlatform(platform,fingerprint){
  let key8=fingerprint.slice(0,8);
  switch(platform){
    case 'youtube': return await detectYouTube(key8);
    case 'tiktok': return await detectTikTok(key8);
    case 'instagram': return await detectIG(key8);
    case 'facebook': return await detectFB(key8);
    case 'shopee': return await detectShopee(key8);
    case 'ruten': return await detectRuten(key8);
    case 'ebay': return await detectEbay(key8);
    case 'amazon': return await detectAmazon(key8);
    default: return null;
  }
}

async function detectYouTube(keyword){
  try{
    let resp=await axios.get('https://website-social-scraper.p.rapidapi.com/v1/youtube-search',{
      params:{ q:keyword },
      headers:{ 'X-RapidAPI-Key':RAPIDAPI_KEY }
    });
    let arr=resp.data.results||[];
    let match=arr.find(x=> x.matchConfidence>=95);
    if(match) return `https://www.youtube.com/watch?v=${match.videoId}`;
  }catch(e){
    console.error('youtube fail:', e.message);
  }
  return null;
}
async function detectTikTok(keyword){...}
async function detectIG(keyword){...}
async function detectFB(keyword){...}
async function detectShopee(keyword){...}
async function detectRuten(keyword){
  try{
    const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--disable-setuid-sandbox']});
    const page=await browser.newPage();
    let url=`https://find.ruten.com.tw/s/?q=${keyword}`;
    await page.goto(url,{waitUntil:'networkidle2'});
    let content=await page.content();
    await browser.close();
    // if content includes '仿冒' or '未授權'
    if(content.includes('仿冒')||content.includes('未授權')){
      return url;
    }
  }catch(e){
    console.error('ruten fail:', e.message);
  }
  return null;
}
async function detectEbay(keyword){...}
async function detectAmazon(keyword){...}

app.listen(8081,()=>{
  console.log('Crawler VVS on 8081');
});
