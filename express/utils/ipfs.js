require('dotenv').config();
const axios = require('axios');

/**
 * 上傳檔案／Buffer／文字至 IPFS daemon (suzoo_ipfs)
 * 回傳 IPFS Hash
 */
async function uploadToIPFS(fileBuffer) {
  // IPFS API 預設跑在 suzoo_ipfs:5001
  const url = 'http://suzoo_ipfs:5001/api/v0/add';

  // 注意: axios 上傳檔案需要 form-data
  // 這裡做簡單範例，若要正式傳檔需使用 'multipart/form-data'
  // 但本範例可將 Buffer 轉 Base64 or 直接透過 Stream
  // 也可使用 ipfs-http-client
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer);

    const response = await axios.post(url, formData, {
      maxBodyLength: Infinity,
      headers: formData.getHeaders()
    });
    return response.data.Hash; // IPFS 回傳 { Name, Hash, Size }
  } catch (err) {
    console.error('IPFS上傳失敗:', err.message);
    throw err;
  }
}

module.exports = {
  uploadToIPFS
};
