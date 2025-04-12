const { DataTypes } = require('sequelize');
const sequelize = require('../db');

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
