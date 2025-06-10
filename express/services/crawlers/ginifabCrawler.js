// express/services/crawlers/ginifabCrawler.js
const path = require('path');
const { saveScreenshot, handleEngineError } = require('../../utils/screenshotUtil');

const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS, 10) || 50;

/**
 * 透過 Ginifab Aggregator, 輸入 imageUrl(公開連結)
 * 順序點擊「微軟必應 / 錫眼睛 / 百度」
 */
async function searchGinifab(browser, imageUrl) {
  const results = {
    bing:   { success:false, links:[], screenshot:'' },
    tineye: { success:false, links:[], screenshot:'' },
    baidu:  { success:false, links:[], screenshot:'' }
  };
  let page;
  const engineName='ginifabAggregator';
  const maxAttempts=2;

  for(let attempt=1; attempt<=maxAttempts; attempt++){
    try {
      page=await browser.newPage();
      await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/',{
        waitUntil:'domcontentloaded',
        timeout:15000
      });
      await page.waitForTimeout(2000);

      const homeShot=path.join('uploads', `ginifab_home_${Date.now()}.png`);
      await saveScreenshot(page, homeShot);

      // 點擊「指定圖片網址」
      await page.evaluate(()=>{
        const link=[...document.querySelectorAll('a')]
          .find(a=>a.innerText.includes('指定圖片網址'));
        if(link) link.click();
      });
      await page.waitForSelector('input[type=text]', { timeout:8000 });
      await page.type('input[type=text]', imageUrl, { delay:50 });
      await page.waitForTimeout(1000);

      const engineList=[
        { name:'bing', label:'微軟必應' },
        { name:'tineye', label:'錫眼睛' },
        { name:'baidu', label:'百度' },
      ];

      for(const eng of engineList){
        try{
          const newPagePromise = new Promise(resolve=>{
            browser.once('targetcreated', async t=>{
              resolve(await t.page());
            });
          });
          // 點擊對應 label
          await page.evaluate(lab=>{
            const a=[...document.querySelectorAll('a')]
              .find(x=>x.innerText.includes(lab));
            if(a) a.click();
          }, eng.label);

          const popupPage=await newPagePromise;
          await popupPage.bringToFront();
          await popupPage.waitForTimeout(3000);

          const shotPath=path.join('uploads', `${eng.name}_via_ginifab_${Date.now()}.png`);
          await saveScreenshot(popupPage, shotPath);

          let hrefs=await popupPage.$$eval('a', as=>as.map(a=>a.href));
          hrefs=hrefs.filter(h=>
            h && !h.includes('ginifab.com') &&
            !h.includes('bing.com') &&
            !h.includes('tineye.com') &&
            !h.includes('baidu.com')
          );
          const top5=hrefs.slice(0, ENGINE_MAX_LINKS);

          results[eng.name].success= top5.length>0;
          results[eng.name].links= top5;
          results[eng.name].screenshot= shotPath;

          await popupPage.close();
        } catch(subErr){
          console.error(`[Ginifab aggregator sub-engine fail => ${eng.name}]`, subErr);
        }
      }
      await page.close();
      break;
    } catch(err){
      await handleEngineError(page, engineName, attempt, err);
      if(page) await page.close().catch(()=>{});
    }
  }
  return results;
}

module.exports = { searchGinifab };
