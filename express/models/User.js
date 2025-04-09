// express/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 
// ↑ 確保此路徑正確，db.js 內已經連到 PostgreSQL

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,            // 不允許重複 Email
    validate: {
      isEmail: true          // 若不是有效 Email => SequelizeValidationError
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
  // 如果您想要 username, user_type 等，可自行加上
}, {
  tableName: 'Users', // 可自訂表名，或改為小寫
  timestamps: true    // 是否需要 createdAt / updatedAt
});

module.exports = User;
