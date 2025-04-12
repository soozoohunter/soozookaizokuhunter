// express/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * Users 資料表:
 *   email, password
 *   userName
 *   plan (BASIC / PRO / ENTERPRISE)
 *   uploadVideos / uploadImages
 *   isEmailVerified, emailVerifyCode
 *   綁定的社群電商平台 (示範: IG, YouTube, TikTok, Shopee, Ruten)
 */
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'tempName'
  },
  // 會員方案
  plan: {
    type: DataTypes.ENUM('BASIC','PRO','ENTERPRISE'),
    allowNull: false,
    defaultValue: 'BASIC'
  },
  // 已上傳 (影片/圖片) 次數 (根據 plan 加以限制)
  uploadVideos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  uploadImages: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // Email 驗證
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  emailVerifyCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 這邊示範綁定平台
  igLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  youtubeLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tiktokLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shopeeLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rutenLink: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
