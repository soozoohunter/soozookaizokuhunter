// express/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // 可能 user 一開始只寄送驗證碼，尚未正式註冊
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true // 同上
  },
  plan: {
    type: DataTypes.ENUM('BASIC','PRO','ENTERPRISE'),
    allowNull: false,
    defaultValue: 'BASIC'
  },
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
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  emailVerifyCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 新增：暫存驗證碼 / 過期時間
  tempEmailCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tempEmailCodeExp: {
    type: DataTypes.BIGINT,
    allowNull: true
  },

  // 社群 & 電商欄位
  facebook:  { type: DataTypes.STRING, allowNull: true },
  instagram: { type: DataTypes.STRING, allowNull: true },
  youtube:   { type: DataTypes.STRING, allowNull: true },
  tiktok:    { type: DataTypes.STRING, allowNull: true },
  shopee:    { type: DataTypes.STRING, allowNull: true },
  ruten:     { type: DataTypes.STRING, allowNull: true },
  amazon:    { type: DataTypes.STRING, allowNull: true },
  taobao:    { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
