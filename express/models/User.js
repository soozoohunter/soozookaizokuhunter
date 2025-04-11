const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * Users 資料表:
 *   email, password, userName, userRole='COPYRIGHT|TRADEMARK|BOTH',
 *   platforms=TEXT(存JSON), trademarkLogo=STRING, registrationNo=STRING
 *
 * 加入 userName.defaultValue = 'tempName'
 * 可解決舊資料因 NOT NULL 違反而報 23502 的問題
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
    defaultValue: 'tempName' // ★ 新增預設值，舊紀錄自動帶此值，避免 NOT NULL 衝突
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
