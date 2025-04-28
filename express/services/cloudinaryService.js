// services/cloudinaryService.js
const cloudinary = require('cloudinary').v2;

// 從環境變數載入 Cloudinary 配置
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

/**
 * 上傳圖片檔至 Cloudinary
 * @param {string} filePath - 本機檔案路徑或URL
 * @return {Promise<Object>} - 傳回 Cloudinary 上傳結果 (包含 secure_url 等)
 */
async function uploadImage(filePath) {
  try {
    // 上傳圖片（預設 resource_type 為 'image'）
    return await cloudinary.uploader.upload(filePath);
  } catch (err) {
    console.error('上傳圖片至 Cloudinary 發生錯誤：', err);
    throw new Error('圖片上傳失敗');
  }
}

/**
 * 上傳影片檔至 Cloudinary
 * @param {string} filePath - 本機影片檔案路徑
 * @return {Promise<Object>} - 傳回 Cloudinary 上傳結果
 */
async function uploadVideo(filePath) {
  try {
    // 上傳影片，需要指定 resource_type 為 'video'
    return await cloudinary.uploader.upload(filePath, { resource_type: 'video' });
  } catch (err) {
    console.error('上傳影片至 Cloudinary 發生錯誤：', err);
    throw new Error('影片上傳失敗');
  }
}

module.exports = { uploadImage, uploadVideo };
