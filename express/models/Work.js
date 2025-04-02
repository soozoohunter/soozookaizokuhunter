const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Work = sequelize.define('Work', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: DataTypes.STRING,
  fingerprint: DataTypes.STRING,
  cloudinaryUrl: DataTypes.TEXT,
  userId: DataTypes.INTEGER,
  fileType: DataTypes.STRING,
  chainRef: DataTypes.STRING,   // 用來記錄區塊鏈上的交易/合約位置
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'works',
  timestamps: false
});

module.exports = Work;
