// express/services/crawlers/ginifabCrawler.js
const path = require('path');
const { saveScreenshot, handleEngineError } = require('../../utils/screenshotUtil');

async function searchGinifab(browser, imageUrl) {
  const engineName = 'ginifabAggregator';
  let page;
  let results = {
    bing: { success:false, links:[], screenshot:'' },
    tineye: { success:false, links:[], screenshot:'' },
    baidu: { success:false, links:[], screenshot:'' }
  };
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      page = await browser.newPage();
      await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
        waitUntil: 'domcontentloaded',
        timeout:15000
      });
      const homeShot = path.join('uploads', `ginifab_home_${Date.now()}.png`);
      await saveScreenshot(page, homeShot);

      // 點擊「指定圖片網址」模式 (若要本機檔案，可改成檔案upload)
      // 這裡簡化，只示範 URL
      await page.waitForTimeout(1000);
      await page.evaluate(() => {
        const link = [...document.querySelectorAll('a')]
          .find(a => a.innerText.includes('指定圖片網址'));
        if (link) link.click();
      });

      await page.waitForSelector('input[type=text]', { timeout:8000 });
      await page.type('input[type=text]', imageUrl, { delay:50 });
      await page.waitForTimeout(500);

      // 順序按 Bing、TinEye、Baidu
      const engines = [
        { name: 'bing', buttonText: /必應|Bing/i },
        { name: 'tineye', buttonText: /錫眼睛|TinEye/i },
        { name: 'baidu', buttonText: /百度|Baidu/i }
      ];
      for (const eng of engines) {
        try {
          const newPagePromise = new Promise(resolve => {
            browser.once('targetcreated', t => resolve(t.page()));
          });
          await page.evaluate((regexStr) => {
            // 依照 button 文字
            const link = [...document.querySelectorAll('a')]
              .find(a => new RegExp(regexStr, 'i').test(a.innerText));
            if (link) link.click();
          }, eng.buttonText.source);

          const popupPage = await newPagePromise;
          await popupPage.bringToFront();
          await popupPage.waitForTimeout(3000);

          // 截圖 => aggregator
          const shotPath = path.join('uploads', `${eng.name}_via_ginifab_${Date.now()}.png`);
          await saveScreenshot(popupPage, shotPath);

          // 提取前五外部連結
          let hrefs = await popupPage.$$eval('a', as => as.map(a => a.href));
          hrefs = hrefs.filter(h => h && !h.includes('ginifab.com') &&
                                        !h.includes('bing.com') &&
                                        !h.includes('tineye.com') &&
                                        !h.includes('baidu.com'));
          const first5 = hrefs.slice(0, 5);
          results[eng.name] = {
            success:true,
            links:first5,
            screenshot:shotPath
          };
          await popupPage.close();
        } catch (subErr) {
          console.error(`[Ginifab] sub engine fail => ${eng.name}`, subErr);
        }
      }

      // 成功 => break
      break;
    } catch (error) {
      await handleEngineError(page, engineName, attempt, error);
    } finally {
      if (page) await page.close().catch(()=>{});
    }
  }
  return results;
}

module.exports = { searchGinifab };
