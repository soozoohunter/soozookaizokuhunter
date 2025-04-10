// express/models/PlatformAccount.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * PlatformAccount: 紀錄使用者不同平台的帳號
 *  userId => Users.id
 *  platform => e.g. 'instagram','shopee'
 *  accountId => 該平台上的帳號ID
 */
const PlatformAccount = sequelize.define('PlatformAccount', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'PlatformAccounts',
  timestamps: true
});

module.exports = PlatformAccount;
