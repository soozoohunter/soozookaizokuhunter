const { tryCloseAd } = require('./closeAdHelper');

const GINIFAB_URL = 'https://www.ginifab.com/feeds/reverse_image_search/';
const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.71 Mobile Safari/537.36';

/**
 * Try the Ginifab reverse image search using both iOS (Safari) and Android (Chrome) user agents for robustness.
 * It will first attempt the iOS flow, and if that fails, it will retry with the Android flow.
 * @param {object} browser - Puppeteer Browser instance.
 * @param {string} imagePath - Filesystem path to the image to be uploaded for search.
 * @returns {object} Puppeteer Page of the search results (caller is responsible for closing this page).
 * @throws Will throw an error if both flows fail to produce a result page.
 */
async function tryGinifabUploadLocalAllFlow(browser, imagePath) {
  let page = null;
  try {
    console.log('Starting Ginifab image search (iOS flow)...');
    page = await browser.newPage();
    const resultPage = await tryGinifabUploadLocal_iOS(page, imagePath);
    // Close the Ginifab page as we now have the results page
    await page.close();
    console.log('Ginifab image search succeeded via iOS flow.');
    return resultPage;
  } catch (err) {
    // If iOS flow fails, attempt Android flow
    if (page) {
      try { await page.close(); } catch (_) {}
    }
    console.warn('iOS flow failed:', err.message);
    console.log('Retrying Ginifab image search (Android flow)...');
    let page2 = null;
    try {
      page2 = await browser.newPage();
      const resultPage = await tryGinifabUploadLocal_Android(page2, imagePath);
      // Close Ginifab page after getting results
      await page2.close();
      console.log('Ginifab image search succeeded via Android flow.');
      return resultPage;
    } catch (err2) {
      if (page2) {
        try { await page2.close(); } catch (_) {}
      }
      console.error('Android flow failed as well:', err2.message);
      throw new Error('Ginifab image search failed on both iOS and Android flows: ' + err2.message);
    }
  }
}

/**
 * Attempt the Ginifab reverse image search using an iOS (Safari) mobile user agent.
 * @param {object} page - Puppeteer Page instance to use (should be a new blank page).
 * @param {string} imagePath - Filesystem path to the image to be uploaded.
 * @returns {object} Puppeteer Page of the search results.
 * @throws If any step fails (element not found, navigation issues, etc.)
 */
async function tryGinifabUploadLocal_iOS(page, imagePath) {
  // Emulate iPhone Safari environment
  await page.setUserAgent(UA_IOS);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true });
  // Navigate to Ginifab reverse image search page
  await page.goto(GINIFAB_URL, { waitUntil: 'domcontentloaded' });
  // Wait for the file input to be present
  let fileInput;
  try {
    fileInput = await page.waitForSelector('#upload_img', { visible: true, timeout: 5000 });
  } catch (e) {
    // Fallback: try to find any file input if the ID has changed
    fileInput = await page.$('input[type=file]');
    if (!fileInput) {
      throw new Error('Upload file input not found on Ginifab page (iOS flow)');
    }
  }
  // Close any advertisement overlay that might obscure the page
  await tryCloseAd(page);
  // Upload the image file
  await fileInput.uploadFile(imagePath);
  // Find and click the Google search button
  const [googleBtn] = await page.$x("//input[contains(@value, 'Google')] | //button[contains(text(), 'Google')] | //a[contains(text(), 'Google')]");
  if (!googleBtn) {
    throw new Error('Google search button not found on Ginifab page (iOS flow)');
  }
  // Click the Google search button and wait for the results page to open
  const pageTarget = page.target();
  const waitForPopup = page.browser().waitForTarget(t => t.opener() === pageTarget && t.type() === 'page', { timeout: 10000 });
  await googleBtn.evaluate(btn => {
    // Ensure the button is in view and trigger click via DOM
    btn.scrollIntoView({ block: 'center', inline: 'center' });
    btn.click();
  });
  const resultTarget = await waitForPopup;
  if (!resultTarget) {
    throw new Error('Google search results page did not open (iOS flow)');
  }
  const resultPage = await resultTarget.page();
  // Wait for the results page to load content
  await resultPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
  return resultPage;
}

/**
 * Attempt the Ginifab reverse image search using an Android (Chrome) mobile user agent.
 * @param {object} page - Puppeteer Page instance to use (should be a new blank page).
 * @param {string} imagePath - Filesystem path to the image to be uploaded.
 * @returns {object} Puppeteer Page of the search results.
 * @throws If any step fails (element not found, navigation issues, etc.)
 */
async function tryGinifabUploadLocal_Android(page, imagePath) {
  // Emulate Android Chrome environment
  await page.setUserAgent(UA_ANDROID);
  await page.setViewport({ width: 360, height: 740, deviceScaleFactor: 2, isMobile: true });
  // Navigate to Ginifab reverse image search page
  await page.goto(GINIFAB_URL, { waitUntil: 'domcontentloaded' });
  // Wait for the file input
  let fileInput;
  try {
    fileInput = await page.waitForSelector('#upload_img', { visible: true, timeout: 5000 });
  } catch (e) {
    fileInput = await page.$('input[type=file]');
    if (!fileInput) {
      throw new Error('Upload file input not found on Ginifab page (Android flow)');
    }
  }
  // Close any advertisement overlay
  await tryCloseAd(page);
  // Upload the image
  await fileInput.uploadFile(imagePath);
  // Find and click the Google search button
  const [googleBtn] = await page.$x("//input[contains(@value, 'Google')] | //button[contains(text(), 'Google')] | //a[contains(text(), 'Google')]");
  if (!googleBtn) {
    throw new Error('Google search button not found on Ginifab page (Android flow)');
  }
  // Click and wait for popup
  const pageTarget = page.target();
  const waitForPopup = page.browser().waitForTarget(t => t.opener() === pageTarget && t.type() === 'page', { timeout: 10000 });
  await googleBtn.evaluate(btn => {
    btn.scrollIntoView({ block: 'center', inline: 'center' });
    btn.click();
  });
  const resultTarget = await waitForPopup;
  if (!resultTarget) {
    throw new Error('Google search results page did not open (Android flow)');
  }
  const resultPage = await resultTarget.page();
  await resultPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
  return resultPage;
}

module.exports = {
  tryGinifabUploadLocalAllFlow,
  tryGinifabUploadLocal_iOS,
  tryGinifabUploadLocal_Android
};
