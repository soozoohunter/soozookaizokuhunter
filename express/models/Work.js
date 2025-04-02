const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Work = sequelize.define('Work', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Works',
  timestamps: true
});

module.exports = Work;
