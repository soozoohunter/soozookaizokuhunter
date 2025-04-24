/************************************************************
 * express/models/User.js
 * - 調整: username、serialNumber欄位
 ************************************************************/
'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // username
    username: {
      type: DataTypes.STRING,
      allowNull: true,  // 若您想強制必填就改 false
      unique: false     // 您想唯一可改 true
    },
    // serialNumber
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true   // 若想必填 + unique，可改 false + unique:true
    },
    // email必填且唯一
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // role
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },
    IG: { type: DataTypes.STRING, allowNull: true },
    FB: { type: DataTypes.STRING, allowNull: true },
    YouTube: { type: DataTypes.STRING, allowNull: true },
    TikTok: { type: DataTypes.STRING, allowNull: true },
    Shopee: { type: DataTypes.STRING, allowNull: true },
    Ruten: { type: DataTypes.STRING, allowNull: true },
    Yahoo: { type: DataTypes.STRING, allowNull: true },
    Amazon: { type: DataTypes.STRING, allowNull: true },
    Taobao: { type: DataTypes.STRING, allowNull: true },
    eBay: { type: DataTypes.STRING, allowNull: true },
    // 其他欄位
    realName: { type: DataTypes.STRING, allowNull: true },
    birthDate: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    plan: { type: DataTypes.STRING, allowNull: false, defaultValue: 'freeTrial' },
    uploadVideos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    uploadImages: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'users',  // <---- 確保跟 DB 一樣
    timestamps: true
  });

  return User;
};
