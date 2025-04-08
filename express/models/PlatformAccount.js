// express/models/PlatformAccount.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // 您的 db.js

class PlatformAccount extends Model {}

PlatformAccount.init({
  // 欄位定義
  platform: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: false
  }
  // 其他欄位...
}, {
  sequelize,
  tableName: 'PlatformAccounts',
  timestamps: true
});

module.exports = PlatformAccount;
