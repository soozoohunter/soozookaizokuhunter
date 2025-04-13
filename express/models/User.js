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
    allowNull: true
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true
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

  // 舊的 emailVerifyCode 你可留著或不用
  emailVerifyCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 新增: 暫存驗證碼
  tempEmailCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tempEmailCodeExp: {
    type: DataTypes.BIGINT,
    allowNull: true
  },

  // 社群 / 電商
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
