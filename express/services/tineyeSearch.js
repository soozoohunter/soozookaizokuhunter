const fs = require('fs');
const path = require('path');

async function searchImageTinEye(browser, imagePath) {
    const result = { success: false, engine: 'TinEye', links: [], error: null };
    let page;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });
            await page.goto('https://tineye.com/', { waitUntil: 'domcontentloaded' });
            // TinEye 首頁有拖拉上傳區和一個隱藏的文件選擇按鈕
            const fileInputSelector = 'input[type=file][name="image"]';
            await page.waitForSelector(fileInputSelector, { timeout: 5000 });
            const fileInput = await page.$(fileInputSelector);
            await fileInput.uploadFile(imagePath);
            await fileInput.evaluate(input => {
                const evt = new Event('change', { bubbles: true });
                input.dispatchEvent(evt);
            });
            // 上傳後 TinEye 通常自動提交，導向結果頁（同窗口刷新）
            // 等待結果文字或結果列表元素出現
            await page.waitForTimeout(5000);  // 給幾秒讓TinEye處理上傳
            // 等待結果計數或 "No results" 文本
            await page.waitForFunction(() => {
                const text = document.body.innerText;
                return text.includes('results') || text.includes('TinEye has not found');
            }, { timeout: 15000 });
            
            // 檢查是否為 "無結果"
            const pageText = await page.evaluate(() => document.body.innerText);
            if (pageText.includes('TinEye has not found') || pageText.toLowerCase().includes('no results')) {
                // 無結果情況
                result.links = [];
            } else {
                // 提取結果連結清單：TinEye 結果頁鏈結通常帶有 /result/ 路徑並target=_blank
                const links = await page.$$eval('a[href^="http"]', anchors => 
                    anchors.filter(a => a.href && !a.href.includes('tineye.com')).map(a => a.href)
                );
                result.links = links;
            }
            result.success = true;
            // 截圖保存結果/無結果頁
            await page.screenshot({ path: path.join(__dirname, `../logs/tineye_${result.links.length ? 'result' : 'noresult'}_${Date.now()}.png`) });
            break;
        } catch (err) {
            result.error = err.message;
            console.error(`TinEye 搜尋嘗試第 ${attempt} 次失敗:`, err);
            if (page) await page.close().catch(e => {});
            if (attempt === 3) {
                if (page) {
                    await page.screenshot({ path: path.join(__dirname, `../logs/tineye_error_${Date.now()}.png`) }).catch(e=>{});
                }
                throw new Error(`TinEye 圖片搜尋失敗: ${err.message}`);
            }
            await new Promise(res => setTimeout(res, 2000));
            continue;
        } finally {
            if (page && !page.isClosed()) {
                await page.close().catch(e => {});
            }
        }
    }
    return result;
}

module.exports = { searchImageTinEye };
