/*************************************************************
 * express/server.js
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

const app = express();

// 中介層
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

    // ---------- 方式1: alter:true 自動嘗試更新(不保證成功) ----------
    // await sequelize.sync({ alter: true });

    // ---------- 方式2: force:true 會直接重建資料表, 所有資料會被刪除! ----------
    // await sequelize.sync({ force: true });

    // 建議只在測試或本地用 force:true 或手動 drop table
    // 兩者只能擇一，不要同時開
    await sequelize.sync({ alter: true });
    console.log('[Express] Sequelize synced.');

    // 建立/更新預設 Admin
    await createAdmin();

  } catch (err) {
    console.error('[Express] Sequelize connect error:', err);
  }
})();

// ----------------------------------------------------------
// 以下示範「Ginifab + fallback (Bing/TinEye/Baidu)」的邏輯
// 直接在 server.js 裡加一個 /debug/gini 路由測試用
// ----------------------------------------------------------
const fs   = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// 如果您已經有 searchOnBing, searchOnTinEye, searchOnBaidu 函式，
// 可以 import；這裡為示例，先內聯 fallback direct approach
async function fallbackDirectEngines(imagePath) {
  // 此處僅簡化示例 => 同時呼叫 Bing/TinEye/Baidu
  // (實務上可各自包成 functions)
  let finalLinks = [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Bing
    let page = await browser.newPage();
    try {
      await page.goto('https://www.bing.com/images', { waitUntil:'domcontentloaded' });
      // 上傳
      const fileChooser = await page.waitForSelector('input[type=file]', { timeout:5000 });
      await fileChooser.uploadFile(imagePath);
      await page.waitForTimeout(4000);

      let links = await page.$$eval('a', as => as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('bing.com'));
      finalLinks.push(...links);
    } catch(e){ console.error('[fallback Bing error]', e); }
    await page.close();

    // TinEye
    page = await browser.newPage();
    try {
      await page.goto('https://tineye.com/', { waitUntil:'domcontentloaded' });
      const fileInput = await page.waitForSelector('input[type=file]', { timeout:5000 });
      await fileInput.uploadFile(imagePath);
      await page.waitForNavigation({ waitUntil:'domcontentloaded', timeout:10000 }).catch(()=>{});
      await page.waitForTimeout(3000);

      let links = await page.$$eval('a', as => as.map(a=>a.href));
      links = links.filter(l => l && !l.includes('tineye.com'));
      finalLinks.push(...links);
    } catch(e){ console.error('[fallback TinEye error]', e); }
    await page.close();

    // Baidu
    page = await browser.newPage();
    try {
      await page.goto('https://graph.baidu.com/', { waitUntil:'domcontentloaded' });
      const fileInput = await page.waitForSelector('input[type=file]', { timeout:5000 });
      await fileInput.uploadFile(imagePath);
      await page.waitForTimeout(5000);

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

  return Array.from(new Set(finalLinks));
}

app.get('/debug/gini', async (req, res) => {
  // 假設測試圖片放在 uploads/test.jpg
  const imagePath = path.join(__dirname, 'uploads', 'test.jpg');
  const resultData = { fileId: 1, bing:[], tineye:[], baidu:[] };

  // 1) 啟動 Puppeteer aggregator => Ginifab
  let aggregatorOk = false;
  let aggregatorLinks = [];
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless:'new',
      args:['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    console.log('[start] ginifab aggregator...');
    await page.goto('https://www.ginifab.com/feeds/reverse_image_search/', { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 嘗試本地檔案上傳
    let fileInput = await page.$('input[type=file]');
    if (fileInput) {
      await fileInput.uploadFile(imagePath);
    } else {
      // fallback: 用 URL (需您有可公開訪問的圖片 URL)
      console.warn('[Ginifab aggregator] local upload not found, use URL fallback...');
      // 這裡僅示範 => 不做
      throw new Error('Mock fail for demonstration');
    }

    await page.waitForTimeout(1500);

    // 依次點擊 Bing/TinEye/Baidu => 監聽 popup
    const engines = [
      { name:'bing',  text:/Bing|必應/  },
      { name:'tineye',text:/TinEye|眼睛/},
      { name:'baidu', text:/Baidu|百度/ }
    ];
    for (let eng of engines){
      const [popup] = await Promise.all([
        new Promise(resolve=>{
          browser.once('targetcreated', t=>resolve(t.page()));
        }),
        page.evaluate((rgx)=>{
          const as = [...document.querySelectorAll('a')];
          const link = as.find(a=> rgx.test(a.innerText));
          if(link) link.click();
        }, eng.text)
      ]);
      await popup.waitForNavigation({ waitUntil:'domcontentloaded', timeout:10000 }).catch(()=>{});
      await popup.waitForTimeout(2000);

      let links = await popup.$$eval('a', as=>as.map(a=>a.href));
      links = links.filter(l=>l && !l.includes('bing.com') && !l.includes('baidu.com') && !l.includes('tineye.com'));
      // 整合
      aggregatorLinks.push(...links);
      await popup.close();
    }

    aggregatorOk = true;
    await browser.close();

  } catch(eAg){
    console.error('[Ginifab aggregator fail => fallback direct approach]', eAg);
    if(browser) await browser.close();
  }

  // 2) fallback direct approach
  let fallbackLinks = [];
  if(!aggregatorOk){
    fallbackLinks = await fallbackDirectEngines(imagePath);
  }

  // 3) 整理回傳
  const finalLinks = aggregatorOk ? aggregatorLinks : fallbackLinks;
  const unique = [...new Set(finalLinks)];
  console.log('[Ginifab aggregator done] aggregatorOk=', aggregatorOk,' total links=', unique.length);

  return res.json({
    aggregatorOk,
    foundLinks: unique.slice(0,20),  // 只展示前20筆
    totalCount: unique.length
  });
});

// ---------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] running on port ${PORT}`);
});
