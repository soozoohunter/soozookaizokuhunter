// express/models/User.js

const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // 請確保 ../db.js 已正確建立並匯出 Sequelize 實例

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: {
        msg: '請提供正確格式的電子郵件'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_type: {
    type: DataTypes.STRING,
    allowNull: true  // 可設定為 'short-video' 或 'seller'
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;