require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const { sequelize } = require('./models');
const createAdmin   = require('./createDefaultAdmin');

// 路由
const paymentRoutes = require('./routes/paymentRoutes');
const protectRouter = require('./routes/protect');
const adminRouter   = require('./routes/admin');
const authRouter    = require('./routes/authRoutes');
const reportRouter  = require('./routes/report');

const fs   = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();

/*──────────────────────────────────────────────
 | 1. 中介層
 *──────────────────────────────────────────────*/
app.use(cors());
app.use(express.json());

/*──────────────────────────────────────────────
 | 2. uploads 對外靜態目錄
 |    ⇒ 確保公開圖片 URL 不再 404
 *──────────────────────────────────────────────*/
// 將 uploads 目錄映射到容器共用的 /uploads
// 以確保 convertAndUpload() 等函式寫入的檔案能被存取
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'))
);

/*──────────────────────────────────────────────
 | 3. 健康檢查
 *──────────────────────────────────────────────*/
app.get('/health', (req, res) => {
  res.send('Express OK (Production Version)');
});

/*──────────────────────────────────────────────
 | 4. 掛載各路由
 *──────────────────────────────────────────────*/
app.use('/api',          paymentRoutes);
app.use('/api',          reportRouter);
app.use('/api/protect',  protectRouter);
app.use('/admin',        adminRouter);
app.use('/auth',         authRouter);

/*──────────────────────────────────────────────
 | 5. Sequelize 連線 & 同步
 *──────────────────────────────────────────────*/
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[Express] Sequelize connected.');

    await sequelize.sync({ alter: true });
    console.log('[Express] Sequelize synced.');

    await createAdmin();
  } catch (err) {
    console.error('[Express] Sequelize connect error:', err);
  }
})();

/*──────────────────────────────────────────────
 | 6. Puppeteer：強制使用新版 Headless
 *──────────────────────────────────────────────*/
process.env.PUPPETEER_HEADLESS = 'new';

/*──────────────────────────────────────────────
 | 7. Ginifab + fallback 測試路由 (/debug/gini)
 *──────────────────────────────────────────────*/
async function fallbackDirectEngines(imagePath) {
  let finalLinks = [];
  let browser;
  const puppeteer = require('puppeteer');

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    /* -- Bing --------------------------------------------------- */
    {
      const page = await browser.newPage();
      try {
        await page.goto('https://www.bing.com/images', { waitUntil: 'domcontentloaded' });
        const fileChooser = await page.waitForSelector('input[type=file]', { timeout: 5000 });
        await fileChooser.uploadFile(imagePath);
        await page.waitForTimeout(4000);
        let links = await page.$$eval('a', as => as.map(a => a.href));
        links = links.filter(l => l && !l.includes('bing.com'));
        finalLinks.push(...links);
      } catch (e) {
        console.error('[fallback Bing error]', e);
      } finally {
        await page.close();
      }
    }

    /* -- TinEye ------------------------------------------------- */
    {
      const page = await browser.newPage();
      try {
        await page.goto('https://tineye.com/', { waitUntil: 'domcontentloaded' });
        const fileInput = await page.waitForSelector('input[type=file]', { timeout: 5000 });
        await fileInput.uploadFile(imagePath);
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(3000);

        let links = await page.$$eval('a', as => as.map(a => a.href));
        links = links.filter(l => l && !l.includes('tineye.com'));
        finalLinks.push(...links);
      } catch (e) {
        console.error('[fallback TinEye error]', e);
      } finally {
        await page.close();
      }
    }

    /* -- Baidu -------------------------------------------------- */
    {
      const page = await browser.newPage();
      try {
        await page.goto('https://graph.baidu.com/', { waitUntil: 'domcontentloaded' });
        const fileInput = await page.waitForSelector('input[type=file]', { timeout: 5000 });
        await fileInput.uploadFile(imagePath);
        await page.waitForTimeout(5000);

        let links = await page.$$eval('a', as => as.map(a => a.href));
        links = links.filter(l => l && !l.includes('baidu.com'));
        finalLinks.push(...links);
      } catch (e) {
        console.error('[fallback Baidu error]', e);
      } finally {
        await page.close();
      }
    }

  } catch (errAll) {
    console.error('[fallbackDirectEngines error]', errAll);
  } finally {
    if (browser) await browser.close();
  }

  return Array.from(new Set(finalLinks));
}

app.get('/debug/gini', async (req, res) => {
  const imagePath = path.join(__dirname, 'uploads', 'test.jpg');
  let aggregatorOk = false;
  let aggregatorLinks = [];
  let browser = null;

  /* 1) Ginifab Aggregator ------------------------------------ */
  try {
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    console.log('[start] ginifab aggregator...');
    await page.goto('https://www.ginifab.com/feeds/reverse_image_search/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const fileInput = await page.$('input[type=file]');
    if (fileInput) {
      await fileInput.uploadFile(imagePath);
    } else {
      throw new Error('Mock fail => no local fileInput found');
    }
    await page.waitForTimeout(1500);

    const engines = [
      { name: 'bing',   text: /Bing|必應/ },
      { name: 'tineye', text: /TinEye|眼睛/ },
      { name: 'baidu',  text: /Baidu|百度/ }
    ];
    for (let eng of engines) {
      const [popup] = await Promise.all([
        new Promise(resolve => {
          browser.once('targetcreated', t => resolve(t.page()));
        }),
        page.evaluate(rgx => {
          const link = [...document.querySelectorAll('a')].find(a => rgx.test(a.innerText));
          if (link) link.click();
        }, eng.text)
      ]);

      await popup.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await popup.waitForTimeout(2000);

      let links = await popup.$$eval('a', as => as.map(a => a.href));
      links = links.filter(l =>
        l && !l.includes('bing.com') &&
        !l.includes('baidu.com') &&
        !l.includes('tineye.com')
      );
      aggregatorLinks.push(...links);

      await popup.close();
    }

    aggregatorOk = true;
    await browser.close();

  } catch (eAg) {
    console.error('[Ginifab aggregator fail => fallback direct approach]', eAg);
    if (browser) await browser.close();
  }

  /* 2) fallback direct approach ------------------------------ */
  let fallbackLinks = [];
  if (!aggregatorOk) {
    fallbackLinks = await fallbackDirectEngines(imagePath);
  }

  /* 3) response ---------------------------------------------- */
  const finalLinks = aggregatorOk ? aggregatorLinks : fallbackLinks;
  const unique = [...new Set(finalLinks)];
  console.log('[Ginifab aggregator done] aggregatorOk=', aggregatorOk, ' total links=', unique.length);

  return res.json({
    aggregatorOk,
    foundLinks: unique.slice(0, 20),
    totalCount: unique.length
  });
});

/*──────────────────────────────────────────────
 | 8. 啟動伺服器
 *──────────────────────────────────────────────*/
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] Running on port ${PORT}`);
});
