// scripts/manualImportToVector.js
/**
 * 範例：人工放檔案到 /data/manualCollected/<platform>/
 * 再用此腳本把該資料夾內的所有檔案 index 到 Python Towhee+Milvus
 *
 * 用法：
 *   node scripts/manualImportToVector.js <platform> [video|image]
 *
 *   <platform> = 'instagram' | 'facebook' | 'youtube' | 'tiktok' | ...
 *   [video|image] = 預設 'image'；若是影片，則呼叫 /api/v1/indexVideo
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

(async()=>{
  try {
    const platform = process.argv[2] || 'instagram';
    const fileType = process.argv[3] || 'image'; // 'image' or 'video'

    // 放檔案的資料夾
    const baseDir = `/data/manualCollected/${platform}`;
    if(!fs.existsSync(baseDir)){
      console.error(`[manualImport] directory not found => ${baseDir}`);
      process.exit(1);
    }

    // 取得該資料夾底下所有檔案
    const files = fs.readdirSync(baseDir).filter(f=>{
      if(fileType==='image'){
        return f.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      } else {
        return f.match(/\.(mp4|mov|avi|mkv|webm)$/i);
      }
    });
    console.log(`[manualImport] Found ${files.length} ${fileType} files in ${baseDir}`);

    // python-vector-service 的 API endpoint
    let apiUrl = 'http://suzoo_python_vector:8000/api/v1/index';
    if(fileType==='video'){
      apiUrl = 'http://suzoo_python_vector:8000/api/v1/indexVideo';
    }

    for(const fName of files){
      const fullPath = path.join(baseDir, fName);
      console.log('[manualImport] uploading =>', fullPath);

      // 準備 multipart/form-data
      const form = new FormData();
      if(fileType==='image'){
        form.append('image', fs.createReadStream(fullPath));
      } else {
        form.append('video', fs.createReadStream(fullPath));
      }
      form.append('id', `${platform}-${fName}`);

      // 傳給 python-vector-service
      try {
        const resp = await axios.post(apiUrl, form, { headers: form.getHeaders() });
        console.log(`[manualImport] ${fName} =>`, resp.data);
      } catch(e){
        console.error(`[manualImport] fail => ${fName}`, e.message);
      }
    }

    console.log('[manualImport] done.');
  } catch(err){
    console.error('[manualImport] error =>', err);
  }
})();
