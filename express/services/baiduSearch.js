const fs = require('fs');
const path = require('path');

async function searchImageBaidu(browser, imagePath) {
    const result = { success: false, engine: 'Baidu', links: [], error: null };
    let page;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });
            // 百度識圖主頁（可能會自動根據UA切換行動版，設定桌面UA防止）
            await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100 Safari/537.36');
            await page.goto('https://graph.baidu.com/pcpage/index?needBatchImage=0', { waitUntil: 'domcontentloaded' });
            // 點擊「上傳圖片」按鈕以顯示文件選擇 input（如有需要）
            try {
                const uploadBtn = await page.$('#uploadImg');
                if (uploadBtn) await uploadBtn.click();
            } catch(e) {}
            // 等待上傳 input 出現
            const fileInputSelector = 'input[type=file]';
            await page.waitForSelector(fileInputSelector, { timeout: 5000 });
            const fileInput = await page.$(fileInputSelector);
            await fileInput.uploadFile(imagePath);
            // 觸發事件並等待結果
            await fileInput.evaluate(input => {
                const evt = new Event('change', { bubbles: true });
                input.dispatchEvent(evt);
            });
            // 百度識圖上傳後可能需要額外點擊確認（視情況而定，此處假設不需要）
            // 等待結果頁面元素，如結果列表或相關提示文字
            await page.waitForTimeout(5000);
            // 檢查是否存在結果縮圖列表
            const noResultIndicator = await page.evaluate(() => {
                return document.body.innerText.includes('没有找到') || document.body.innerText.includes('未找到');
            });
            if (noResultIndicator) {
                // 無結果
                result.links = [];
            } else {
                // 提取搜尋結果連結（過濾出百度搜尋結果中指向外部的連結）
                const links = await page.$$eval('a[href]', anchors =>
                    anchors.map(a => a.href).filter(href => href && !href.includes('baidu.com') && !href.startsWith('javascript'))
                );
                // 去重與去除空值
                result.links = Array.from(new Set(links));
            }
            result.success = true;
            await page.screenshot({ path: path.join(__dirname, `../logs/baidu_${result.links.length ? 'result' : 'noresult'}_${Date.now()}.png`) });
            break;
        } catch (err) {
            result.error = err.message;
            console.error(`Baidu 搜尋嘗試第 ${attempt} 次失敗:`, err);
            if (page) await page.close().catch(e => {});
            if (attempt === 3) {
                if (page) {
                    await page.screenshot({ path: path.join(__dirname, `../logs/baidu_error_${Date.now()}.png`) }).catch(e=>{});
                }
                throw new Error(`百度識圖搜尋失敗: ${err.message}`);
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

module.exports = { searchImageBaidu };
