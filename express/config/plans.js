/********************************************************************
 * config/plans.js
 * 方案與配額設定
 ********************************************************************/
module.exports = {
  BASIC: {
    uploadLimit: 3,           // videos
    uploadLimitImages: 10,    // images
    apiLimit: 20
  },
  PRO: {
    uploadLimit: 20,
    uploadLimitImages: 50,
    apiLimit: 100
  },
  ENTERPRISE: {
    uploadLimit: 9999,
    uploadLimitImages: 9999,
    apiLimit: 9999
  },
  // free / trademark ... 都可自行擴充
  free: {
    uploadLimit: 2,
    uploadLimitImages: 5,
    apiLimit: 5
  }
};
