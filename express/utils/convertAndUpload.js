/**
 * express/utils/convertAndUpload.js
 * 
 * 提供兩個主要功能：
 * 1) convertAndUpload(): 圖片轉檔為 PNG (或 JPG) 後，儲存到 /uploads/publicImages/，回傳公開 URL
 * 2) insertEmbeddingToDB(): (可選) 把圖片 URL + 向量寫入 PostgreSQL/AnalyticDB (若您需要向量檢索)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
// 如果需要 AnalyticDB/PostgreSQL
// const { Client } = require('pg');

const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads');
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'https://suzookaizokuhunter.com';

/**
 * 圖片轉為 PNG + 存到 /uploads/publicImages
 * @param {string} localFilePath - 本地檔案原路徑 (ex: /app/uploads/imageForSearch_123.jpg)
 * @param {string} ext - 原檔名附檔 (ex: ".jpg")
 * @param {number} fileId - 資料庫 File ID
 * @returns {Promise<string>} 可公開訪問的圖片 URL
 */
async function convertAndUpload(localFilePath, ext, fileId){
  try {
    // 1) 讀取 buffer
    const buf = fs.readFileSync(localFilePath);

    // 2) 嘗試用 Sharp 轉成 PNG，若失敗則 fallback 原檔案
    let outputBuffer;
    try {
      outputBuffer = await sharp(buf)
        // 可自行加 resize 或壓縮
        .resize({ width: 2000, withoutEnlargement:true })
        .png()
        .toBuffer();
    } catch(e) {
      console.error('[convertAndUpload] sharp error =>', e);
      // fallback
      outputBuffer = buf;
    }

    // 3) 寫入 /uploads/publicImages
    const publicImagesDir = path.join(UPLOAD_BASE_DIR, 'publicImages');
    if(!fs.existsSync(publicImagesDir)){
      fs.mkdirSync(publicImagesDir, { recursive:true });
    }
    // 檔名: public_{fileId}_{TimeStamp}.png
    const outName = `public_${fileId}_${Date.now()}.png`;
    const outPath = path.join(publicImagesDir, outName);
    fs.writeFileSync(outPath, outputBuffer);

    // 4) 產生公開 URL
    // e.g. https://suzookaizokuhunter.com/uploads/publicImages/public_123_1681234567.png
    const publicUrl = `${PUBLIC_HOST.replace(/\/$/, '')}/uploads/publicImages/${outName}`;

    console.log('[convertAndUpload] =>', publicUrl);
    return publicUrl;
  } catch(err){
    console.error('[convertAndUpload main error]', err);
    throw err;
  }
}

/**
 * 可選：將圖片URL + 向量嵌入寫入 PostgreSQL/AnalyticDB
 * @param {string} fileUrl - 轉檔後公開圖片URL
 * @param {number} fileId
 */
// async function insertEmbeddingToDB(fileUrl, fileId){
//   // 這裡僅示範 fakeEmbedding
//   const fakeEmbedding = Array(512).fill(0).map((_,i)=> Math.random());
//   const embeddingStr = '[' + fakeEmbedding.join(',') + ']';

//   const client = new Client({
//     host: process.env.PGHOST || 'localhost',
//     port: process.env.PGPORT || 5432,
//     user: process.env.PGUSER || 'postgres',
//     password: process.env.PGPASSWORD || 'postgres',
//     database: process.env.PGDATABASE || 'adbpg_test'
//   });

//   await client.connect();
//   const sql = `INSERT INTO image_vectors (file_id, image_url, embedding)
//                VALUES ($1, $2, $3::vector)`;
//   try {
//     await client.query(sql, [fileId, fileUrl, embeddingStr]);
//     console.log('[insertEmbeddingToDB] done =>', fileId);
//   } catch(e) {
//     console.error('[insertEmbeddingToDB] error =>', e);
//   } finally {
//     await client.end();
//   }
// }

module.exports = {
  convertAndUpload,
  // insertEmbeddingToDB
};
