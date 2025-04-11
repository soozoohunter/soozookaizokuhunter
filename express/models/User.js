// express/models/User.js

const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * Users 資料表:
 *   email, password, userName, userRole='COPYRIGHT|TRADEMARK|BOTH'
 *   platforms=TEXT(存JSON), trademarkLogo=STRING, registrationNo=STRING
 *
 *   新增 plan (BASIC, PRO, ENTERPRISE)
 *   新增 uploadVideos, uploadImages (記錄已上傳次數，用於限制)
 */

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'tempName' // 解決舊資料 not null
  },
  userRole: {
    type: DataTypes.ENUM('COPYRIGHT', 'TRADEMARK', 'BOTH'),
    allowNull: false,
    defaultValue: 'COPYRIGHT'
  },
  platforms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  trademarkLogo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  registrationNo: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // ★ 會員等級 (BASIC / PRO / ENTERPRISE)
  plan: {
    type: DataTypes.ENUM('BASIC','PRO','ENTERPRISE'),
    allowNull: false,
    defaultValue: 'BASIC'
  },

  // ★ 紀錄已上傳的影片/圖片次數 (示範用)
  uploadVideos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  uploadImages: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }

}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
