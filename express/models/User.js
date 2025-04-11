// express/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 

/**
 * Users 資料表:
 *   email, password, userName, userRole='COPYRIGHT|TRADEMARK|BOTH', 
 *   platforms=TEXT(存JSON), trademarkLogo=STRING, registrationNo=STRING
 */
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'tempName' // 避免舊資料衝突 NOT NULL
  },
  userRole: {
    type: DataTypes.ENUM('COPYRIGHT', 'TRADEMARK', 'BOTH'),
    allowNull: false,
    defaultValue: 'COPYRIGHT'
  },
  platforms: {
    type: DataTypes.TEXT, 
    allowNull: true
  },
  trademarkLogo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  registrationNo: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
