// express/models/User.js

const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * Users 資料表:
 *   email, password, userName, userRole
 *   plan (BASIC/PRO/ENTERPRISE)
 *   uploadVideos / uploadImages
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
  userRole: {
    type: DataTypes.ENUM('COPYRIGHT','TRADEMARK','BOTH'),
    allowNull: false,
    defaultValue: 'COPYRIGHT'
  },
  // 會員方案
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
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
