'use strict';

/************************************************************
 * models/User.js
 * - 調整 schema: username, serialNumber 改可 null
 * - 若要必填/唯一可自行改 allowNull / unique
 ************************************************************/
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // 自動ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // ★ serialNumber 預設可為 null
    //   若您想強制必填 + 唯一，可改 allowNull: false, unique: true
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,   // ← 調整為可為 null
      unique: false      // ← 視需求可改 true
    },

    // email必填且唯一
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    // ★ username 改 allowNull: true, 預計用 phone 帶入
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false      // 若您想讓 username 唯一，可改 true
    },

    // 密碼
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // 角色
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },

    // 社群平台
    IG: { type: DataTypes.STRING, allowNull: true },
    FB: { type: DataTypes.STRING, allowNull: true },
    YouTube: { type: DataTypes.STRING, allowNull: true },
    TikTok: { type: DataTypes.STRING, allowNull: true },

    // 電商平台
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
