const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PlatformAccount = sequelize.define('PlatformAccount', {
  platform: {
    type: DataTypes.STRING,
    allowNull: false
  },
  account_details: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'PlatformAccounts',
  timestamps: true
});

module.exports = PlatformAccount;
