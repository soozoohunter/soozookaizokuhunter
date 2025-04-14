// config/plans.js
module.exports = {
  free:    { uploadLimit: 5, apiLimit: 10 },    // 免費方案：最多上傳5次、API調用10次
  premium: { uploadLimit: 100, apiLimit: 1000 } // 付費方案：上傳100次、API調用1000次
  // 可加入其他方案
};
