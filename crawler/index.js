require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const puppeteer = require('puppeteer');

const { RAPIDAPI_KEY } = process.env;

const app = express();
app.use(bodyParser.json());

app.get('/health',(req,res)=> res.json({status:'Crawler V1 Ultimate healthy'}));

/**
 * POST /detectInfringement
 * body:{ fingerprint, workId, role }
 * 依 role=shortVideo => [youtube, tiktok, instagram, facebook]
 *    role=ecommerce => [shopee, ruten, ebay, amazon]
 */
app.post('/detectInfringement', async(req,res)=>{
  const { fingerprint, workId, role } = req.body;
  if(!fingerprint||!workId) return res.status(400).json({error:'缺 fingerprint,workId'});
  console.log(`crawler: detect => fingerprint=${fingerprint.slice(0,10)}, wId=${workId}, role=${role}`);

  let platforms = (role==='shortVideo')
    ? ['youtube','tiktok','instagram','facebook']
    : ['shopee','ruten','ebay','amazon'];

  let results=[];
  for(let pf of platforms){
    let r = await detectPlatform(pf, fingerprint);
    if(r) {
      results.push({platform:pf, url:r});
      // call express -> /api/infr/dmca
      try{
        await axios.post('http://express:3000/api/infr/dmca',{
          workId,
          infringingUrl: r
        },{
          headers:{
            // 需token? 如果express檢查 => 這裡可跳過 or set internal token
            'Authorization':'Bearer CrawlerInternalToken'
          }
        });
      } catch(e){
        console.error('DMCA call fail:', e.message);
      }
    }
  }

  res.json({ message:'偵測完成', foundInfringements: results});
});

async function detectPlatform(platform, fingerprint){
  let key8 = fingerprint.slice(0,8);
  switch(platform){
    case 'youtube': return await detectYouTube(key8);
    case 'tiktok': return await detectTikTok(key8);
    case 'instagram': return await detectInstagram(key8);
    case 'facebook': return await detectFacebook(key8);
    case 'shopee': return await detectShopee(key8);
    case 'ruten': return await detectRuten(key8);
    case 'ebay': return await detectEbay(key8);
    case 'amazon': return await detectAmazon(key8);
    default: return null;
  }
}

async function detectYouTube(keyword){
  // 以 website-social-scraper for youtube
  try{
    let resp = await axios.get('https://website-social-scraper.p.rapidapi.com/v1/youtube-search',{
      params:{ q:keyword },
      headers:{
        'X-RapidAPI-Key': RAPIDAPI_KEY
      }
    });
    // resp.data.results => [ {videoId, matchConfidence} ...]
    let hits = resp.data.results||[];
    let match = hits.find(x=> x.matchConfidence>=95);
    if(match) return `https://www.youtube.com/watch?v=${match.videoId}`;
  }catch(e){
    console.error('youtube detect fail:', e.message);
  }
  return null;
}

async function detectTikTok(keyword){...} // 同理, 參照 youtube

async function detectInstagram(keyword){...}

async function detectFacebook(keyword){...}

async function detectShopee(keyword){...}

async function detectRuten(keyword){
  // puppeteer => search
  try{
    const browser = await puppeteer.launch({
      headless:true,
      args:['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    let url=`https://find.ruten.com.tw/s/?q=${keyword}`;
    await page.goto(url,{waitUntil:'networkidle2'});
    let content=await page.content();
    await browser.close();

    if(content.includes('仿冒')||content.includes('未授權')){
      return url;
    }
  }catch(e){
    console.error('ruten detect fail:', e.message);
  }
  return null;
}

async function detectEbay(keyword){...}
async function detectAmazon(keyword){...}

app.listen(8081,()=>{
  console.log('Crawler V1 Ultimate on port 8081');
});
