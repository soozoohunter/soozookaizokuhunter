/********************************************************************
 * config/plans.js
 * 方案與配額設定
 ********************************************************************/
module.exports = {
  free: {
    uploadLimit: 5,
    uploadLimitImages: 5,
    apiLimit: 50
  },
  premium: {
    uploadLimit: 50,
    uploadLimitImages: 100,
    apiLimit: 500
  },
  enterprise: {
    uploadLimit: 500,
    uploadLimitImages: 1000,
    apiLimit: 5000
  },
  // 亦可擴充 BASIC, PRO, ENTERPRISE if needed
};
