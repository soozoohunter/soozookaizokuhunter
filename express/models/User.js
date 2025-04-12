const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * Users 資料表:
 *   email, password, userName, userRole
 *   plan (BASIC/PRO/ENTERPRISE)
 *   uploadVideos / uploadImages / uploadTrademarks
 *   verifyEmail (是否已透過Email驗證)
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
  uploadTrademarks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  verifyEmail: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
