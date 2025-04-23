'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // 主鍵id會自動生成（默認）
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

    // 改為 userName (原先 username)
    userName: {
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
    IG: {
      type: DataTypes.STRING,
      allowNull: true
    },
    FB: {
      type: DataTypes.STRING,
      allowNull: true
    },
    YouTube: {
      type: DataTypes.STRING,
      allowNull: true
    },
    TikTok: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Shopee: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Ruten: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Yahoo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Amazon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Taobao: {
      type: DataTypes.STRING,
      allowNull: true
    },
    eBay: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {});
  return User;
};
