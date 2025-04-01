// express/models/PlatformAccount.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

// 若要使用自動增號整數，可改成 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }
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
  }
}, {
  tableName: 'platform_accounts',
  timestamps: true,       // Sequelize會自動維護 createdAt, updatedAt
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PlatformAccount;
