const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Infringement = sequelize.define('Infringement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  workId: DataTypes.INTEGER,
  infringingUrl: DataTypes.TEXT,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  demandedPrice: DataTypes.DECIMAL,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'infringements',
  timestamps: false
});

module.exports = Infringement;
