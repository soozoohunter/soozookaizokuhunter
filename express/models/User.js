// express/models/User.js

const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 

/**
 * User Model
 * email, password  -> 基本帳密
 * userName         -> 使用者暱稱
 * userRole         -> 'COPYRIGHT' or 'TRADEMARK' (也可 'BOTH')
 * platforms        -> JSON or TEXT, 儲存使用者平台帳號清單
 * trademarkLogo    -> 若該 userRole='TRADEMARK'，可在註冊時上傳商標圖, 這裡存檔案路徑/URL
 * registrationNo   -> 若該商標已核准, 可紀錄商標證號
 */
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userRole: {
    type: DataTypes.ENUM('COPYRIGHT', 'TRADEMARK', 'BOTH'),
    allowNull: false,
    defaultValue: 'COPYRIGHT'
  },
  platforms: {
    type: DataTypes.TEXT, 
    // or DataTypes.JSON
    // 如果要儲存多組平台: "['instagram','facebook']"
    allowNull: true
  },
  trademarkLogo: {
    type: DataTypes.STRING, // 儲存檔案路徑
    allowNull: true
  },
  registrationNo: {
    type: DataTypes.STRING, // 商標證號
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
