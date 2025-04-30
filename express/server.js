/*************************************************************
 * express/server.js (最終整合版)
 *************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const createAdmin = require('./createDefaultAdmin');

// 如果您有其他 routes
const paymentRoutes = require('./routes/paymentRoutes');
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/authRoutes');

const path = require('path');
const fs   = require('fs');
const puppeteer = require('puppeteer-extra');
// Stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// ---- 節省篇幅：若您已在其他檔案 require 'puppeteer'，可自行整合 ----

// =================== 主要伺服器初始設定 ===================
const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.send('Express OK (Production Version)');
});

// 掛載各路由
app.use('/api', paymentRoutes);
app.use('/api/protect', protectRouter);
app.use('/admin', adminRouter);
app.use('/auth', authRouter);

// DB 連線 & 同步
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[Express] Sequelize connected.');

    // ---------- alter:true 只在測試或本地情況下使用 ----------
    await sequelize.sync({ alter: true });
    console.log('[Express] Sequelize synced.');

    // 建立/更新預設 Admin
    await createAdmin();

  } catch (err) {
    console.error('[Express] Sequelize connect error:', err);
  }
})();

// ----------------------------------------------------------
// 下列示範「先 aggregator (Ginifab) -> fallback (Bing/TinEye/Baidu)」的邏輯
// ----------------------------------------------------------

// [1] 嘗試關閉廣告
async function tryCloseAd(page) {
  try {
    const closeBtnSelector = 'button.ad-close, .adCloseBtn, .close';
    await page.waitForTimeout(2000);
    const closeBtn = await page.$(closeBtnSelector);
    if (closeBtn) {
      console.log('[tryCloseAd] found ad close button, clicking...');
      await closeBtn.click();
      await page.waitForTimeout(1000);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[tryCloseAd error]', e);
    return false;
  }
}

// [2] 多嘗試本機圖片上傳 (iOS / Android / Desktop)
async function tryGinifabUploadLocalAllFlow(page, localImagePath){
  // 預設三種 flow 順序: iOS -> Android -> Desktop
  let ok = await tryGinifabUploadLocal_iOS(page, localImagePath);
  if(ok) return true;

  ok = await tryGinifabUploadLocal_Android(page, localImagePath);
  if(ok) return true;

  ok = await tryGinifabUploadLocal_Desktop(page, localImagePath);
  if(ok) return true;

  return false;
}

// (a) iOS flow
async function tryGinifabUploadLocal_iOS(page, localImagePath){
  try {
    await tryCloseAd(page);
    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(!uploadLink) throw new Error('No "上傳本機圖片" link for iOS flow');
    await uploadLink.click();
    await page.waitForTimeout(1000);

    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if(!chooseFileBtn) throw new Error('No "選擇檔案" link for iOS flow');
    await chooseFileBtn.click();
    await page.waitForTimeout(1000);

    const [photoBtn] = await page.$x("//a[contains(text(),'照片圖庫') or contains(text(),'相簿') or contains(text(),'Photo Library')]");
    if(!photoBtn) throw new Error('No "照片圖庫" link for iOS flow');
    await photoBtn.click();
    await page.waitForTimeout(1500);

    // 有些版本會有「完成 / Done」按鈕
    const [finishBtn] = await page.$x("//a[contains(text(),'完成') or contains(text(),'Done') or contains(text(),'OK')]");
    if(finishBtn){
      await finishBtn.click();
      await page.waitForTimeout(1000);
    }

    // 真正上傳
    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('No <input type=file> for iOS flow');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_iOS] success');
    return true;
  } catch(e) {
    console.warn('[tryGinifabUploadLocal_iOS fail]', e.message);
    return false;
  }
}

// (b) Android flow
async function tryGinifabUploadLocal_Android(page, localImagePath){
  try {
    await tryCloseAd(page);
    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'上傳照片')]");
    if(!uploadLink) throw new Error('No "上傳本機圖片" link for Android flow');
    await uploadLink.click();
    await page.waitForTimeout(1000);

    const [chooseFileBtn] = await page.$x("//a[contains(text(),'選擇檔案') or contains(text(),'挑選檔案')]");
    if(!chooseFileBtn) throw new Error('No "選擇檔案" link for Android flow');
    await chooseFileBtn.click();
    await page.waitForTimeout(2000);

    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('No <input type=file> for Android flow');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_Android] success');
    return true;
  } catch(e) {
    console.warn('[tryGinifabUploadLocal_Android fail]', e.message);
    return false;
  }
}

// (c) Desktop flow
async function tryGinifabUploadLocal_Desktop(page, localImagePath){
  try {
    await tryCloseAd(page);
    const [uploadLink] = await page.$x("//a[contains(text(),'上傳本機圖片') or contains(text(),'Upload from PC')]");
    if(!uploadLink) throw new Error('No "上傳本機圖片" link for Desktop flow');
    await uploadLink.click();
    await page.waitForTimeout(1000);

    const fileInput = await page.$('input[type=file]');
    if(!fileInput) throw new Error('No <input type=file> in Desktop flow');
    await fileInput.uploadFile(localImagePath);
    await page.waitForTimeout(2000);

    console.log('[tryGinifabUploadLocal_Desktop] success');
    return true;
  } catch(e){
    console.warn('[tryGinifabUploadLocal_Desktop fail]', e.message);
    return false;
  }
}

// [3] aggregatorSearchGinifab => 先嘗試本機上傳 (iOS/Android/Desktop) → 若失敗改用 URL / Google fallback
async function aggregatorSearchGinifab(localImagePath){
  let finalLinks = [];
  let aggregatorOk = false;
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    // userAgent 避免部分檢測
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.goto('https://www.ginifab.com.tw/tools/search_image_by_image/', {
      waitUntil:'domcontentloaded',
      timeout:20000
    });
    await page.waitForTimeout(2000);

    // 嘗試多flow
    let successLocal = await tryGinifabUploadLocalAllFlow(page, localImagePath);
    if(!successLocal){
      // 舊 fallback => 單純 tryGinifabUploadLocal
      successLocal = await tryGinifabUploadLocal(page, localImagePath);
    }

    if(!successLocal){
      console.warn('[aggregatorSearchGinifab] local upload fail => aggregator fail => skip...');
      // aggregator fail => 不返回任何 links
    } else {
      // aggregator success => 順序點擊 Bing / TinEye / Baidu
      const engines = [
        { name:'bing',   label:['微軟必應','Bing'] },
        { name:'tineye', label:['錫眼睛','TinEye'] },
        { name:'baidu',  label:['百度','Baidu'] }
      ];
      for(const eng of engines){
        try {
          const newTab = new Promise(resolve=>{
            browser.once('targetcreated', async t => resolve(await t.page()));
          });
          // 在 ginifab 主頁面找到連結
          await page.evaluate((labels)=>{
            let as = [...document.querySelectorAll('a')];
            for(const lab of labels){
              let found = as.find(a=> a.innerText.includes(lab));
              if(found){ found.click(); return; }
            }
          }, eng.label);

          const popup = await newTab;
          await popup.waitForTimeout(3000);

          let hrefs = await popup.$$eval('a', as=> as.map(a=> a.href));
          // 過濾 ginifab / bing / tineye / baidu 自身連結
          hrefs = hrefs.filter(h=>
            h && !h.includes('ginifab') &&
            !h.includes('bing.com') &&
            !h.includes('tineye.com') &&
            !h.includes('baidu.com')
          );
          finalLinks.push(...hrefs);
          await popup.close();
        } catch(eSub){
          console.error(`[aggregator sub-engine fail => ${eng.name}]`, eSub);
        }
      }
      aggregatorOk = true;
    }
  } catch(eAg){
    console.error('[aggregatorSearchGinifab fail]', eAg);
  } finally {
    if(browser) await browser.close().catch(()=>{});
  }
  // 回傳
  return { aggregatorOk, aggregatorLinks: [...new Set(finalLinks)] };
}

// [4] fallbackDirectEngines => 同您原先範例
async function fallbackDirectEngines(imagePath) {
  let finalLinks = [];
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Bing
    let page = await browser.newPage();
    try {
      await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded' });
      // Bing 有時會用 #sb_sbi or input[type=file] 來上傳，範例簡化
      let fileInput = await page.$('input[type=file]');
      if(fileInput) {
        await fileInput.uploadFile(imagePath);
        await page.waitForTimeout(4000);
      }
      let links = await page.$$eval('a', as => as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('bing.com'));
      finalLinks.push(...links);
    } catch(e){ console.error('[fallback Bing error]', e); }
    await page.close();

    // TinEye
    page = await browser.newPage();
    try {
      await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded' });
      let fileInput = await page.$('input[type=file]');
      if(fileInput){
        await fileInput.uploadFile(imagePath);
        await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:10000 }).catch(()=>{});
        await page.waitForTimeout(3000);
      }
      let links = await page.$$eval('a', as => as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('tineye.com'));
      finalLinks.push(...links);
    } catch(e){ console.error('[fallback TinEye error]', e); }
    await page.close();

    // Baidu
    page = await browser.newPage();
    try {
      await page.goto('https://graph.baidu.com/', { waitUntil:'domcontentloaded' });
      let fileInput = await page.$('input[type=file]');
      if(fileInput){
        await fileInput.uploadFile(imagePath);
        await page.waitForTimeout(5000);
      }
      let links = await page.$$eval('a', as => as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('baidu.com'));
      finalLinks.push(...links);
    } catch(e){ console.error('[fallback Baidu error]', e); }
    await page.close();

  } catch(errAll){
    console.error('[fallbackDirectEngines error]', errAll);
  } finally {
    await browser.close();
  }

  return [...new Set(finalLinks)];
}

// --------------------------
// [DEMO] /debug/gini
// --------------------------
app.get('/debug/gini', async (req, res) => {
  // 假設測試圖片放在 uploads/test.jpg
  const imagePath = path.join(__dirname, 'uploads', 'test.jpg');

  // 1) aggregatorSearchGinifab
  const { aggregatorOk, aggregatorLinks } = await aggregatorSearchGinifab(imagePath);
  console.log('[debug/gini] aggregatorOk=', aggregatorOk, ' aggregatorLinks=', aggregatorLinks.length);

  // 2) fallbackDirectEngines
  let finalLinks = aggregatorLinks;
  if(!aggregatorOk || aggregatorLinks.length === 0){
    console.log('[debug/gini] aggregator fail => fallback direct engines...');
    const fallbackLinks = await fallbackDirectEngines(imagePath);
    finalLinks = fallbackLinks;
  }

  const uniqueLinks = [...new Set(finalLinks)];
  return res.json({
    aggregatorOk,
    foundLinks: uniqueLinks.slice(0,20), // 僅回傳前20筆
    totalCount: uniqueLinks.length
  });
});

// ---------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] running on port ${PORT}`);
});
