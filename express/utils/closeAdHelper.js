/**
 * express/utils/closeAdHelper.js
 *
 * tryCloseAd - 嘗試在 Ginifab (或其他頁面) 關閉廣告彈窗。
 *  - 預設 maxTimes=2，即最多嘗試關閉兩次。
 *  - 文字包含「×」「X」「關閉」、或 CSS 選擇器 .close-btn 等，請依實際情況調整。
 */

async function tryCloseAd(page, maxTimes = 2) {
  let closedCount = 0;

  for (let i = 0; i < maxTimes; i++) {
    try {
      // 多組 XPath/CSS
      const [closeBtn] = await Promise.race([
        page.$x(
          "//button[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]" +
          " | //span[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]" +
          " | //div[contains(text(),'×') or contains(text(),'X') or contains(text(),'關閉')]"
        ),
        page.$('button.close, .close-btn, .modal-close, #ad_box button')
      ]);
      if (closeBtn) {
        console.log('[tryCloseAd] found ad close button => clicking...');
        // 確保滾到可見範圍再點
        await closeBtn.evaluate(el => {
          el.scrollIntoView({ block: 'center', inline: 'center' });
          el.click();
        });
        await page.waitForTimeout(1200);
        closedCount++;
      } else {
        break;
      }
    } catch (e) {
      console.warn('[tryCloseAd] fail =>', e);
      break;
    }
  }

  if (closedCount > 0) {
    console.log(`[tryCloseAd] total closed => ${closedCount}`);
    return true;
  }
  console.log('[tryCloseAd] ad close button not found...');
  return false;
}

module.exports = {
  tryCloseAd
};
