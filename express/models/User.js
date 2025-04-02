const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_type: {
    type: DataTypes.STRING,
    allowNull: true  // 'short-video' or 'seller'
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
