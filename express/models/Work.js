// express/models/Work.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Work = sequelize.define('Work', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileType: {
    type: DataTypes.ENUM('shortVideo','image','trademark'),
    defaultValue: 'image'
  },
  keywords: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fingerprint: {
    type: DataTypes.STRING,
    allowNull: false
  },
  chainTx: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Works',
  timestamps: true
});

module.exports = Work;
