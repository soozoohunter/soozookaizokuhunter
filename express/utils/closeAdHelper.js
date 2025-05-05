/**
 * Attempts to close any advertisement overlay if present on the page.
 * This function will search for common close button patterns and click it if found.
 * @param {object} page - Puppeteer Page instance to operate on.
 */
async function tryCloseAd(page) {
  // Small delay to allow any overlay ad to appear
  await page.waitForTimeout(1000);
  let adClosed = false;
  const closeSelectors = [
    '[id*="close"]',
    '[class*="close"]',
    '[onclick*="close"]',
    '[aria-label*="close"]',
    'button[title*="Close"]',
    '.close-btn', '.close', '#close', '#closeBtn', '#cboxClose'
  ];
  for (const sel of closeSelectors) {
    try {
      const closeBtn = await page.waitForSelector(sel, { visible: true, timeout: 1000 });
      if (closeBtn) {
        // Scroll into view and click via DOM to avoid interception issues
        await closeBtn.evaluate(btn => {
          btn.scrollIntoView({ block: 'center', inline: 'center' });
          btn.click();
        });
        // Give some time for the overlay to close
        await page.waitForTimeout(500);
        adClosed = true;
        break;
      }
    } catch (err) {
      // Continue to next selector if not found within timeout
    }
  }
  if (!adClosed) {
    console.log('Ad close button not found, continuing without closing an ad.');
  } else {
    console.log('Ad overlay closed successfully.');
  }
}

module.exports = {
  tryCloseAd
};
