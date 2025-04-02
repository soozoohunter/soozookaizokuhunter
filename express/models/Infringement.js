const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Infringement = sequelize.define('Infringement', {
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  chainRef: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Infringements',
  timestamps: true
});

module.exports = Infringement;
