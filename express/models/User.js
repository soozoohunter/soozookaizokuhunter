// express/models/User.js

const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 
// ↑ 假設 express/db.js 已經連到 PostgreSQL

// 定義 'Users' 資料表
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,  // 不允許重複
    validate: {
      isEmail: true // 需符合 Email 格式
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'Users',  // 或 'users'
  timestamps: true     // 若需要 createdAt/updatedAt
});

module.exports = User;
