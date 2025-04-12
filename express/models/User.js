// express/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * 方案: BASIC / PRO / ENTERPRISE
 *   - BASIC: shortVideo=3, image=15, trademark=1
 *   - PRO:   shortVideo=50, image=150, trademark=10
 *   - ENT:   unlimited
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
    defaultValue: 0
  },
  uploadImages: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  uploadTrademarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationCode: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
