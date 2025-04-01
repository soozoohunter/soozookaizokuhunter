const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password_hash: DataTypes.STRING,
  role: {
    type: DataTypes.STRING,
    defaultValue: 'shortVideo'
  }
}, {
  tableName: 'users',
  timestamps: false
});

module.exports = User;
