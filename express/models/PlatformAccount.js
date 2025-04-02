const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PlatformAccount = sequelize.define('PlatformAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  platformName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  accessToken: {
    type: DataTypes.TEXT
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'platform_accounts',
  timestamps: false
});

module.exports = PlatformAccount;
