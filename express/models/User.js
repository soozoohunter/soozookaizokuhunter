'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // ID 主鍵
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // ★ Phone 當作 username
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },

    // 社群平台欄位
    IG: { type: DataTypes.STRING, allowNull: true },
    FB: { type: DataTypes.STRING, allowNull: true },
    YouTube: { type: DataTypes.STRING, allowNull: true },
    TikTok: { type: DataTypes.STRING, allowNull: true },

    // 電商平台欄位
    Shopee: { type: DataTypes.STRING, allowNull: true },
    Ruten: { type: DataTypes.STRING, allowNull: true },
    Yahoo: { type: DataTypes.STRING, allowNull: true },
    Amazon: { type: DataTypes.STRING, allowNull: true },
    Taobao: { type: DataTypes.STRING, allowNull: true },
    eBay: { type: DataTypes.STRING, allowNull: true },

    // 其他欄位
    realName: { type: DataTypes.STRING, allowNull: true },
    birthDate: { type: DataTypes.DATEONLY, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    plan: { type: DataTypes.STRING, allowNull: false, defaultValue: 'freeTrial' },
    uploadVideos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    uploadImages: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  }, {
    tableName: 'users',
    timestamps: true
  });

  return User;
};
