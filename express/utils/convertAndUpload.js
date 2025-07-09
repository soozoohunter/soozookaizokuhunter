/**
 * express/utils/convertAndUpload.js
 * 
 * 提供兩個主要功能：
 * 1) convertAndUpload(): 圖片轉檔為 PNG (或 JPG) 後，儲存到 /uploads/publicImages/，或 (可選) 上傳 S3，最後回傳公開 URL
 * 2) insertEmbeddingToDB(): (可選) 把圖片 URL + 向量寫入 PostgreSQL/AnalyticDB (若需要向量檢索)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 若需要 AnalyticDB/PostgreSQL，取消註解以下
// const { Client } = require('pg');

// 若要啟用 S3 上傳，請確保您有 utils/s3Helper.js (或其他) 實作上傳邏輯
// const { uploadToS3 } = require('./s3Helper');

/**
 * 環境變數：
 * - USE_S3_UPLOAD: "true" or "false" (是否啟用 S3 上傳)
 * - PUBLIC_HOST: 自訂主機名，如 https://suzookaizokuhunter.com
 */
const USE_S3_UPLOAD = (process.env.USE_S3_UPLOAD === 'true');
// Default to localhost for development if PUBLIC_HOST not specified
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'http://localhost:3000';

// 本地模式預設的 uploads/publicImages 路徑
const UPLOAD_BASE_DIR = '/app/uploads';
const PUBLIC_IMAGES_DIR = path.join(UPLOAD_BASE_DIR, 'publicImages');

// 建立本地目錄（若不存在）
function ensureLocalDir(dirPath) {
  if(!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath, { recursive:true });
  }
}

/**
 * 圖片轉為 PNG 後，依環境設定上傳至 S3 或存本地，再回傳公開 URL。
 * @param {string} localFilePath - 本地檔案原路徑 (ex: /app/uploads/imageForSearch_123.jpg)
 * @param {string} ext - 原檔名附檔 (ex: ".jpg")
 * @param {number|string} fileId - 資料庫 File ID (可為數字或字串)
 * @returns {Promise<string>} 可公開訪問的圖片 URL
 */
async function convertAndUpload(localFilePath, ext, fileId){
  try {
    // Step 1) 讀取 buffer
    const buf = fs.readFileSync(localFilePath);

    // Step 2) 使用 Sharp 嘗試轉成 PNG，若失敗則 fallback 原檔案
    let outputBuffer;
    try {
      outputBuffer = await sharp(buf)
        // 建議可自行調整品質或加入壓縮參數，如 .png({ quality:90 })
        .resize({ width: 2000, withoutEnlargement: true })
        .png()
        .toBuffer();

      console.log(`[convertAndUpload] Sharp轉檔成功, fileId=${fileId}`);
    } catch(e) {
      console.error(`[convertAndUpload] Sharp轉檔失敗, fallback 原檔案 =>`, e.message);
      outputBuffer = buf;
    }

    // Step 3) 準備輸出檔名：public_{fileId}_{TimeStamp}.png
    const fileName = `public_${fileId}_${Date.now()}.png`;

    // Step 4a) 若啟用 S3 上傳
    if(USE_S3_UPLOAD){
      console.log('[convertAndUpload] 正在上傳至 S3...');
      // const s3Key = `publicImages/${fileName}`;
      // const s3Url = await uploadToS3(outputBuffer, s3Key);
      // console.log('[convertAndUpload] S3 完成 =>', s3Url);
      // return s3Url;

      // 這裡先範例寫法，需要您自行實作 uploadToS3()
      // 若不需要，請保留本地或自行改寫。
      throw new Error('尚未實作 S3 上傳邏輯，請在此接入 uploadToS3() 並返回 s3Url');
    }

    // Step 4b) 若不啟用 S3，則存本地 /uploads/publicImages
    ensureLocalDir(PUBLIC_IMAGES_DIR);
    const outPath = path.join(PUBLIC_IMAGES_DIR, fileName);
    fs.writeFileSync(outPath, outputBuffer);

    // 產生公開 URL (本地或 Nginx 可存取之路徑)
    // e.g. "https://suzookaizokuhunter.com/uploads/publicImages/public_123_1681234567.png"
    const publicUrl = `${PUBLIC_HOST.replace(/\/$/, '')}/uploads/publicImages/${fileName}`;

    console.log('[convertAndUpload] 本地存檔完成 =>', publicUrl);
    return publicUrl;
  } catch(err){
    console.error('[convertAndUpload main error]', err);
    throw err;
  }
}

/**
 * (可選) 將圖片 URL + 向量嵌入寫入 PostgreSQL/AnalyticDB
 * 
 * @param {string} fileUrl - 轉檔後公開圖片URL
 * @param {number|string} fileId - 資料庫檔案ID
 * @param {Array<number>} embedding - 圖片或文件的向量 (ex: [0.12, -0.09, ...])
 */
// async function insertEmbeddingToDB(fileUrl, fileId, embedding){
//   const client = new Client({
//     host: process.env.PGHOST || 'localhost',
//     port: process.env.PGPORT || 5432,
//     user: process.env.PGUSER || 'postgres',
//     password: process.env.PGPASSWORD || 'postgres',
//     database: process.env.PGDATABASE || 'adbpg_test'
//   });

//   try {
//     await client.connect();
//     // 依照實際資料表結構插入
//     // 假設 image_vectors (file_id int, image_url text, embedding vector(512))
//     const sql = `INSERT INTO image_vectors (file_id, image_url, embedding)
//                  VALUES ($1, $2, $3::vector)`;

//     // 假設 embedding 以文字形式存進 vector
//     const embeddingStr = '[' + embedding.join(',') + ']';

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
