const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const manualLinks = require('../data/manual_links.json');

async function cachePages(){
  const browser = await puppeteer.launch();
  for (const [fingerprint, urls] of Object.entries(manualLinks)) {
    const dir = path.join(__dirname, '../uploads/cachedSearchPages', fingerprint);
    await fs.ensureDir(dir);

    for(const url of urls){
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      const html = await page.content();
      const hostname = new URL(url).hostname.replace(/\..+$/, '');
      await fs.writeFile(`${dir}/${hostname}.html`, html, 'utf8');
      console.log(`[Cached] ${url} to ${dir}/${hostname}.html`);
      await page.close();
    }
  }
  await browser.close();
}

cachePages().catch(console.error);
