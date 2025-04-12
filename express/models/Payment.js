const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lastFive: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  planWanted: {
    type: DataTypes.ENUM('BASIC','PRO','ENTERPRISE'),
    allowNull: false,
    defaultValue: 'PRO'
  },
  status: {
    type: DataTypes.ENUM('PENDING','APPROVED','REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING'
  }
}, {
  tableName: 'Payments',
  timestamps: true
});

module.exports = Payment;
